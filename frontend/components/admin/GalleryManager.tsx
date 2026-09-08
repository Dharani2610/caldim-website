"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FileText, Film, Plus, Trash2 } from "lucide-react";
import { Button, Field, Panel, StatusMessage, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

/**
 * Placing media on the site.
 *
 * The media library is a store; this screen is the arrangement. Uploading and
 * placing are separate on purpose — one asset can appear in several slots, and
 * pulling it off a page never deletes the file.
 */

export interface GalleryAsset {
  id: string;
  resourceType: "image" | "video" | "raw";
  originalName: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
}

export interface GalleryRow {
  id: string;
  collection: string;
  mediaId: string;
  caption: string;
  meta: string;
  published: boolean;
  sortOrder: number;
  media: GalleryAsset | null;
}

const COLLECTIONS = [
  { value: "gallery", label: "Gallery", blurb: "The main project gallery on the homepage." },
  { value: "projects", label: "Projects", blurb: "Featured project cards." },
  { value: "shopfloor", label: "Shop floor", blurb: "Fabrication and site footage." },
  { value: "certificates", label: "Certificates", blurb: "Official certificates and accreditations shown on /certificates." },
] as const;

export default function GalleryManager({
  items: initial,
  assets,
}: {
  items: GalleryRow[];
  assets: GalleryAsset[];
}) {
  const router = useRouter();
  const token = useCsrfToken();
  const api = createApiClient(token);

  const [items, setItems] = useState(initial);
  const [collection, setCollection] = useState<string>("gallery");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [picking, setPicking] = useState(false);

  const shown = useMemo(
    () =>
      items
        .filter((item) => item.collection === collection)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items, collection]
  );

  const placedIds = useMemo(
    () => new Set(shown.map((item) => item.mediaId)),
    [shown]
  );

  const place = async (asset: GalleryAsset) => {
    setStatus("saving");
    setMessage("Adding…");

    const { ok, data } = await api("/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({
        collection,
        mediaId: asset.id,
        caption: asset.title || "",
        meta: "",
        published: true,
        sortOrder: shown.length,
      }),
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be added.");
      return;
    }

    const item = (data as unknown as { item: Omit<GalleryRow, "media"> }).item;
    setItems((current) => [...current, { ...item, media: asset }]);
    setPicking(false);
    setStatus("saved");
    setMessage("Added.");
  };

  const save = async (row: GalleryRow, changes: Partial<GalleryRow>) => {
    setStatus("saving");
    setMessage("Saving…");

    const { ok, data } = await api(`/api/admin/gallery/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be saved.");
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === row.id ? { ...item, ...changes } : item))
    );
    setStatus("saved");
    setMessage("Saved.");
  };

  const remove = async (row: GalleryRow) => {
    if (!confirm("Remove this from the page? The media itself stays in your library.")) {
      return;
    }

    setStatus("saving");
    setMessage("Removing…");

    const { ok, data } = await api(`/api/admin/gallery/${row.id}`, { method: "DELETE" });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be removed.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== row.id));
    setStatus("saved");
    setMessage("Removed.");
  };

  const move = async (row: GalleryRow, delta: -1 | 1) => {
    const list = [...shown];
    const index = list.findIndex((item) => item.id === row.id);
    if (index === -1) return;
    const target = index + delta;
    if (target < 0 || target >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);

    const reordered = list.map((item, i) => ({ ...item, sortOrder: i }));
    setItems((current) =>
      current.map((item) => {
        const found = reordered.find((r) => r.id === item.id);
        return found ? found : item;
      })
    );

    const { ok, data } = await api("/api/admin/gallery", {
      method: "PUT",
      body: JSON.stringify({ order: reordered.map((r) => r.id) }),
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "Couldn't save the new order.");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {COLLECTIONS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setCollection(tab.value);
                setPicking(false);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                collection === tab.value
                  ? "bg-accent text-steel-950 font-semibold"
                  : "bg-steel-900/60 text-paper-dim hover:text-paper"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <StatusMessage status={status} message={message} />
          <Button type="button" variant="primary" onClick={() => setPicking((value) => !value)}>
            <Plus size={14} aria-hidden="true" />
            {picking ? "Close picker" : "Add media"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-paper-dim">
        {COLLECTIONS.find((c) => c.value === collection)?.blurb}
      </p>

      {picking && (
        <Panel title="Select from your media library">
          <p className="mb-4 text-xs text-paper-dim">
            Click an item to place it in the {collection} collection.
          </p>
          {assets.length === 0 ? (
            <p className="text-sm text-paper-dim">
              Nothing uploaded yet. Add photos, video, or certificates under Media first.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {assets.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => void place(asset)}
                    disabled={placedIds.has(asset.id)}
                    className="group block w-full overflow-hidden rounded-lg border border-blueprint text-left transition-colors hover:border-accent disabled:opacity-40"
                    title={
                      placedIds.has(asset.id)
                        ? "Already in this slot"
                        : `Add ${asset.originalName}`
                    }
                  >
                    <span className="relative flex aspect-[4/3] items-center justify-center bg-steel-950">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-accent">
                          <FileText size={24} />
                          <span className="text-[10px] font-mono mt-1 text-paper-dim">PDF</span>
                        </div>
                      )}
                      {asset.resourceType === "video" && (
                        <Film
                          size={12}
                          className="absolute left-1.5 top-1.5 text-paper"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="block truncate p-2 text-[11px] text-paper-dim">
                      {asset.title || asset.originalName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {shown.length === 0 ? (
        <Panel>
          <p className="text-sm text-paper-dim">
            Nothing placed here yet. Use &ldquo;Add media&rdquo; to put an image or document in
            this slot.
          </p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {shown.map((item, index) => (
            <li key={item.id}>
              <Panel>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-steel-950">
                    {item.media?.thumbnailUrl ? (
                      <img
                        src={item.media.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-accent">
                        <FileText size={28} />
                        <span className="text-[10px] font-mono mt-1 text-paper-dim">PDF</span>
                      </div>
                    )}
                    {item.media?.resourceType === "video" && (
                      <Film
                        size={13}
                        className="absolute left-2 top-2 text-paper"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Field label="CAPTION" htmlFor={`caption-${item.id}`}>
                      <TextInput
                        id={`caption-${item.id}`}
                        defaultValue={item.caption}
                        maxLength={160}
                        onBlur={(event) => {
                          if (event.target.value !== item.caption) {
                            void save(item, { caption: event.target.value });
                          }
                        }}
                      />
                    </Field>
                    <Field
                      label="DETAIL"
                      htmlFor={`meta-${item.id}`}
                      hint="Location, tonnage, year"
                    >
                      <TextInput
                        id={`meta-${item.id}`}
                        defaultValue={item.meta}
                        maxLength={120}
                        onBlur={(event) => {
                          if (event.target.value !== item.meta) {
                            void save(item, { meta: event.target.value });
                          }
                        }}
                      />
                    </Field>
                  </div>

                  <div className="flex shrink-0 flex-row items-start gap-3 sm:flex-col">
                    <label className="flex items-center gap-2 text-xs text-paper-dim">
                      <input
                        type="checkbox"
                        checked={item.published}
                        onChange={(event) =>
                          void save(item, { published: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-blueprint bg-steel-900 accent-accent"
                      />
                      Live
                    </label>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => void move(item, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="rounded border border-blueprint px-2 py-1 text-xs text-paper-dim transition-colors hover:text-accent disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => void move(item, 1)}
                        disabled={index === shown.length - 1}
                        aria-label="Move down"
                        className="rounded border border-blueprint px-2 py-1 text-xs text-paper-dim transition-colors hover:text-accent disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => void remove(item)}
                      className="inline-flex items-center gap-1.5 text-xs text-paper-dim transition-colors hover:text-red-400"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
