"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Button, Field, Panel, StatusMessage, TextArea, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

export interface LeaderRow {
  id: string;
  name: string;
  title: string;
  credentials: string;
  bio: string;
  location: string;
  email: string;
  linkedinUrl: string;
  photoId: string;
  photoUrl: string | null;
  published: boolean;
  sortOrder: number;
}

const BLANK: Omit<LeaderRow, "id" | "sortOrder"> = {
  name: "",
  title: "",
  credentials: "",
  bio: "",
  location: "",
  email: "",
  linkedinUrl: "",
  photoId: "",
  photoUrl: null,
  published: true,
};

/** Mirrors the server cap, so an oversized file is caught before it uploads. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function LeadershipManager({ initial }: { initial: LeaderRow[] }) {
  const router = useRouter();
  const api = createApiClient(useCsrfToken());
  const token = useCsrfToken();

  const [rows, setRows] = useState<LeaderRow[]>(initial);
  const [editing, setEditing] = useState<LeaderRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const draft = editing ?? (creating ? { ...BLANK, id: "", sortOrder: rows.length } : null);

  const patchDraft = (patch: Partial<LeaderRow>) => {
    if (editing) setEditing({ ...editing, ...patch });
    else if (creating) setEditing({ ...BLANK, id: "", sortOrder: rows.length, ...patch });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing({ ...BLANK, id: "", sortOrder: rows.length });
    setFields({});
    setMessage("");
    setStatus("idle");
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setFields({});
    setMessage("");
    setStatus("idle");
  };

  const save = async () => {
    if (!draft) return;
    setStatus("saving");
    setMessage("Saving…");
    setFields({});

    const payload = {
      name: draft.name,
      title: draft.title,
      credentials: draft.credentials,
      bio: draft.bio,
      location: draft.location,
      email: draft.email,
      linkedinUrl: draft.linkedinUrl,
      photoId: draft.photoId,
      published: draft.published,
      sortOrder: draft.sortOrder,
    };

    const isNew = !draft.id;
    const { ok, data } = await api<{ leader?: LeaderRow }>(
      isNew ? "/api/admin/leaders" : `/api/admin/leaders/${draft.id}`,
      { method: isNew ? "POST" : "PUT", body: payload }
    );

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be saved.");
      setFields(data.fields ?? {});
      return;
    }

    setStatus("saved");
    setMessage(isNew ? "Leader added." : "Changes saved.");
    cancel();
    router.refresh();

    const saved = data.leader;
    if (saved) {
      const row: LeaderRow = { ...draft, ...saved, photoUrl: draft.photoUrl } as LeaderRow;
      setRows((current) => (isNew ? [...current, row] : current.map((r) => (r.id === row.id ? row : r))));
    }
  };

  const remove = async (row: LeaderRow) => {
    // A destructive action with no undo deserves an explicit confirmation.
    if (!window.confirm(`Remove ${row.name} from the leadership section? This can't be undone.`)) {
      return;
    }
    setStatus("saving");
    setMessage("Removing…");

    const { ok, data } = await api(`/api/admin/leaders/${row.id}`, { method: "DELETE" });
    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be removed.");
      return;
    }

    setRows((current) => current.filter((r) => r.id !== row.id));
    setStatus("saved");
    setMessage(`${row.name} removed.`);
    router.refresh();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);

    const { ok, data } = await api("/api/admin/leaders/reorder", {
      body: { order: next.map((row) => row.id) },
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "The new order couldn't be saved.");
      setRows(rows); // roll back to what the server still believes
      return;
    }
    setStatus("saved");
    setMessage("Order updated.");
    router.refresh();
  };

  const uploadPhoto = async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus("error");
      setMessage("That image is over 5MB. Export it smaller and try again.");
      return;
    }

    setStatus("saving");
    setMessage("Uploading…");

    const body = new FormData();
    body.set("file", file);
    body.set("altText", draft?.name ? `${draft.name}, ${draft.title}` : "Leadership portrait");

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "x-caldim-csrf": token },
        body,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        url?: string;
        asset?: { id: string };
      };

      if (!response.ok || !data.ok || !data.asset) {
        setStatus("error");
        setMessage(data.error ?? "That image couldn't be uploaded.");
        return;
      }

      patchDraft({ photoId: data.asset.id, photoUrl: data.url ?? null });
      setStatus("saved");
      setMessage("Photo uploaded. Save to attach it.");
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <StatusMessage status={status} message={message} />
        {!draft && (
          <Button onClick={startCreate}>
            <Plus size={15} aria-hidden="true" />
            Add leader
          </Button>
        )}
      </div>

      {draft && (
        <Panel
          title={draft.id ? `Editing ${draft.name || "leader"}` : "New leadership entry"}
          description="Name and title are required. Everything else is optional and hidden on the public page when empty."
        >
          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div>
              <p className="label-mono-sm mb-2 text-paper-dim">Photo</p>
              <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-lg border border-blueprint bg-steel-950">
                {draft.photoUrl ? (
                  <img src={draft.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-paper-dim/60">
                    <UserRound size={28} aria-hidden="true" />
                    <span className="label-mono-sm">NO PHOTO</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                id="leader-photo"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPhoto(file);
                  event.target.value = "";
                }}
              />
              <Button variant="secondary" onClick={() => fileInput.current?.click()} className="w-full">
                <Upload size={14} aria-hidden="true" />
                {draft.photoUrl ? "Replace" : "Upload"}
              </Button>
              <p className="mt-2 text-xs leading-relaxed text-paper-dim/80">
                JPEG, PNG, WebP or AVIF, up to 5MB. Images are re-encoded and
                stripped of location data on upload. Portrait crops work best.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="leader-name" error={fields.name}>
                  <TextInput
                    id="leader-name"
                    value={draft.name}
                    error={fields.name}
                    onChange={(event) => patchDraft({ name: event.target.value })}
                    placeholder="Bala Subramanian"
                  />
                </Field>
                <Field label="Title" htmlFor="leader-title" error={fields.title}>
                  <TextInput
                    id="leader-title"
                    value={draft.title}
                    error={fields.title}
                    onChange={(event) => patchDraft({ title: event.target.value })}
                    placeholder="Principal, Connections Design"
                  />
                </Field>
                <Field label="Credentials" htmlFor="leader-credentials">
                  <TextInput
                    id="leader-credentials"
                    value={draft.credentials}
                    onChange={(event) => patchDraft({ credentials: event.target.value })}
                    placeholder="PE, SE"
                  />
                </Field>
                <Field label="Location" htmlFor="leader-location">
                  <TextInput
                    id="leader-location"
                    value={draft.location}
                    onChange={(event) => patchDraft({ location: event.target.value })}
                    placeholder="Chennai, India"
                  />
                </Field>
                <Field label="Email" htmlFor="leader-email" error={fields.email}>
                  <TextInput
                    id="leader-email"
                    type="email"
                    value={draft.email}
                    error={fields.email}
                    onChange={(event) => patchDraft({ email: event.target.value })}
                    placeholder="bala@caldimengg.com"
                  />
                </Field>
                <Field label="LinkedIn URL" htmlFor="leader-linkedin" error={fields.linkedinUrl}>
                  <TextInput
                    id="leader-linkedin"
                    type="url"
                    value={draft.linkedinUrl}
                    error={fields.linkedinUrl}
                    onChange={(event) => patchDraft({ linkedinUrl: event.target.value })}
                    placeholder="https://www.linkedin.com/in/…"
                  />
                </Field>
              </div>

              <Field
                label="Short bio"
                htmlFor="leader-bio"
                hint="Two sentences reads best on the card. Say what they're accountable for."
              >
                <TextArea
                  id="leader-bio"
                  rows={3}
                  value={draft.bio}
                  onChange={(event) => patchDraft({ bio: event.target.value })}
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-paper-dim">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) => patchDraft({ published: event.target.checked })}
                  className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                />
                Show on the public site
              </label>

              <div className="flex gap-3 pt-1">
                <Button onClick={save} disabled={status === "saving"}>
                  {status === "saving" ? "Saving…" : draft.id ? "Save changes" : "Add leader"}
                </Button>
                <Button variant="ghost" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {rows.length === 0 && !draft ? (
        <Panel>
          <p className="text-sm text-paper-dim">
            No leadership entries yet. The public page is showing four
            placeholder cards until you add real people here.
          </p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex items-center gap-4 rounded-xl border border-blueprint bg-steel-900/30 p-4"
            >
              <div className="h-14 w-11 shrink-0 overflow-hidden rounded border border-blueprint bg-steel-950">
                {row.photoUrl ? (
                  <img src={row.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-paper-dim/50">
                    <UserRound size={16} aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-sm text-paper-dim">{row.title}</p>
              </div>

              <span
                className={`label-mono-sm hidden shrink-0 items-center gap-1.5 sm:inline-flex ${
                  row.published ? "text-accent" : "text-paper-dim/60"
                }`}
              >
                {row.published ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
                {row.published ? "LIVE" : "HIDDEN"}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${row.name} up`}
                  className="rounded p-1.5 text-paper-dim transition-colors hover:text-accent disabled:opacity-30"
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Move ${row.name} down`}
                  className="rounded p-1.5 text-paper-dim transition-colors hover:text-accent disabled:opacity-30"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setEditing(row);
                    setFields({});
                    setMessage("");
                  }}
                >
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => remove(row)}
                  aria-label={`Remove ${row.name}`}
                  className="rounded p-1.5 text-paper-dim transition-colors hover:text-red-400"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
