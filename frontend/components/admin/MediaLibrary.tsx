"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Film, ImageIcon, Pencil, Trash2, Upload } from "lucide-react";
import { Button, Panel, StatusMessage } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

export interface Asset {
  id: string;
  resourceType: "image" | "video" | "raw";
  originalName: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string;
  title: string;
  createdAt: string;
  url: string;
  thumbnailUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

type Filter = "all" | "image" | "video";

export default function MediaLibrary({
  assets: initial,
  maxVideoMb,
}: {
  assets: Asset[];
  maxVideoMb: number;
}) {
  const router = useRouter();
  const token = useCsrfToken();
  const api = createApiClient(token);

  const [assets, setAssets] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);

  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const shown = useMemo(
    () => (filter === "all" ? assets : assets.filter((a) => a.resourceType === filter)),
    [assets, filter]
  );

  /** Photos go through our server, which re-encodes them before storing. */
  const uploadPhoto = async (file: File) => {
    setStatus("saving");
    setMessage("Uploading photo…");

    const body = new FormData();
    body.set("file", file);

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "x-caldim-csrf": token },
        body,
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; asset?: Asset };
      if (!response.ok || !data.ok || !data.asset) {
        setStatus("error");
        setMessage(data.error ?? "That photo couldn't be uploaded.");
        return;
      }
      setAssets((current) => [data.asset as Asset, ...current]);
      setStatus("saved");
      setMessage("Photo uploaded.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server.");
    }
  };

  /**
   * Video goes browser → Cloudinary directly, because a file this size can't
   * be buffered through a route handler. Our server is still involved twice:
   * once to check the file's header and sign the upload, and once afterwards
   * to verify with Cloudinary that it actually landed.
   */
  const uploadVideo = async (file: File) => {
    setStatus("saving");
    setMessage("Preparing upload…");
    setProgress(0);

    try {
      // The first 32 bytes are enough to identify the container.
      const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
      let binary = "";
      header.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });

      const signed = await api("/api/admin/media/video", {
        method: "POST",
        body: JSON.stringify({
          header: btoa(binary),
          size: file.size,
          filename: file.name,
        }),
      });

      if (!signed.ok) {
        setStatus("error");
        setProgress(null);
        setMessage(signed.data.error ?? "That video was rejected.");
        return;
      }

      const s = signed.data as unknown as {
        endpoint: string;
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        publicId: string;
      };

      const form = new FormData();
      form.set("file", file);
      form.set("api_key", s.apiKey);
      form.set("timestamp", String(s.timestamp));
      form.set("signature", s.signature);
      form.set("folder", s.folder);
      form.set("public_id", s.publicId);

      // XHR rather than fetch: it reports upload progress, and a 200MB file
      // with no feedback looks like a hung page.
      const uploaded = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", s.endpoint);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
            setMessage(`Uploading video… ${Math.round((event.loaded / event.total) * 100)}%`);
          }
        };
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
        xhr.onerror = () => resolve(false);
        xhr.send(form);
      });

      if (!uploaded) {
        setStatus("error");
        setProgress(null);
        setMessage("The upload didn't complete. Try again.");
        return;
      }

      setMessage("Verifying…");
      const confirmed = await api("/api/admin/media/video", {
        method: "PUT",
        body: JSON.stringify({
          publicId: `${s.folder}/${s.publicId}`,
          originalName: file.name,
        }),
      });

      setProgress(null);

      if (!confirmed.ok) {
        setStatus("error");
        setMessage(confirmed.data.error ?? "That upload couldn't be confirmed.");
        return;
      }

      const asset = (confirmed.data as unknown as { asset: Asset }).asset;
      setAssets((current) => [asset, ...current]);
      setStatus("saved");
      setMessage("Video uploaded.");
      router.refresh();
    } catch {
      setStatus("error");
      setProgress(null);
      setMessage("We couldn't reach the server.");
    }
  };

  const saveDetails = async (asset: Asset, altText: string, title: string) => {
    setStatus("saving");
    setMessage("Saving…");

    const { ok, data } = await api("/api/admin/media", {
      method: "PATCH",
      body: JSON.stringify({ id: asset.id, altText, title }),
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "Those details couldn't be saved.");
      return;
    }

    setAssets((current) =>
      current.map((item) => (item.id === asset.id ? { ...item, altText, title } : item))
    );
    setEditing(null);
    setStatus("saved");
    setMessage("Saved.");
  };

  const remove = async (asset: Asset) => {
    if (!window.confirm(`Delete ${asset.originalName}? This can't be undone.`)) return;

    setStatus("saving");
    setMessage("Deleting…");

    const { ok, data } = await api(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    if (!ok) {
      setStatus("error");
      // A 409 here means the asset is still used by a leader profile or placed
      // in a gallery slot, and the message names where — more useful than a
      // generic failure.
      setMessage(data.error ?? "That file couldn't be deleted.");
      return;
    }

    setAssets((current) => current.filter((item) => item.id !== asset.id));
    setStatus("saved");
    setMessage("Deleted.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StatusMessage status={status} message={message} />

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex overflow-hidden rounded-lg border border-blueprint"
            role="group"
            aria-label="Filter by type"
          >
            {(["all", "image", "video"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`label-mono-sm px-3 py-2 font-semibold transition-colors ${
                  filter === value
                    ? "bg-accent text-steel-950"
                    : "text-paper-dim hover:text-accent"
                }`}
              >
                {value === "all" ? "ALL" : value === "image" ? "PHOTOS" : "VIDEO"}
              </button>
            ))}
          </div>

          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadPhoto(file);
              event.target.value = "";
            }}
          />
          <input
            ref={videoInput}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadVideo(file);
              event.target.value = "";
            }}
          />

          <Button onClick={() => photoInput.current?.click()}>
            <Upload size={15} aria-hidden="true" />
            Upload photo
          </Button>
          <Button onClick={() => videoInput.current?.click()}>
            <Film size={15} aria-hidden="true" />
            Upload video
          </Button>
        </div>
      </div>

      {progress !== null && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-steel-900"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-full bg-accent transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {shown.length === 0 ? (
        <Panel>
          <p className="text-sm text-paper-dim">
            {assets.length === 0
              ? `No media yet. Upload photos here, or video up to ${maxVideoMb}MB.`
              : "Nothing of that type yet."}
          </p>
        </Panel>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((asset) => (
            <li
              key={asset.id}
              className="overflow-hidden rounded-xl border border-blueprint bg-steel-900/30"
            >
              <div className="relative aspect-[4/3] bg-steel-950">
                <img
                  src={asset.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
                <span
                  className="label-mono-sm absolute left-2 top-2 flex items-center gap-1 rounded bg-steel-950/85 px-1.5 py-1 text-paper"
                  aria-label={asset.resourceType === "video" ? "Video" : "Photo"}
                >
                  {asset.resourceType === "video" ? (
                    <>
                      <Film size={11} aria-hidden="true" />
                      {formatDuration(asset.duration)}
                    </>
                  ) : (
                    <ImageIcon size={11} aria-hidden="true" />
                  )}
                </span>
              </div>

              <div className="p-3">
                <p className="truncate text-xs font-medium" title={asset.originalName}>
                  {asset.title || asset.originalName}
                </p>
                <p className="label-mono-sm mt-1 text-paper-dim/80">
                  {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                  {formatBytes(asset.byteSize)}
                </p>

                {editing?.id === asset.id ? (
                  <EditFields
                    asset={asset}
                    onCancel={() => setEditing(null)}
                    onSave={(alt, title) => void saveDetails(asset, alt, title)}
                  />
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(asset)}
                      className="inline-flex items-center gap-1.5 text-xs text-paper-dim transition-colors hover:text-accent"
                    >
                      <Pencil size={12} aria-hidden="true" />
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(asset)}
                      className="inline-flex items-center gap-1.5 text-xs text-paper-dim transition-colors hover:text-red-400"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditFields({
  asset,
  onSave,
  onCancel,
}: {
  asset: Asset;
  onSave: (altText: string, title: string) => void;
  onCancel: () => void;
}) {
  const [altText, setAltText] = useState(asset.altText);
  const [title, setTitle] = useState(asset.title);

  return (
    <div className="mt-3 space-y-2">
      <label className="block">
        <span className="label-mono-sm text-paper-dim">TITLE</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={160}
          className="mt-1 w-full rounded border border-blueprint bg-steel-950 px-2 py-1.5 text-xs"
        />
      </label>
      <label className="block">
        <span className="label-mono-sm text-paper-dim">ALT TEXT</span>
        <input
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          maxLength={200}
          placeholder="What the image shows"
          className="mt-1 w-full rounded border border-blueprint bg-steel-950 px-2 py-1.5 text-xs"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(altText, title)}
          className="label-mono-sm rounded bg-accent px-2.5 py-1.5 font-semibold text-steel-950"
        >
          SAVE
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="label-mono-sm px-2 py-1.5 text-paper-dim hover:text-accent"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
