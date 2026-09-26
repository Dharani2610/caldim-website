"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button, Field, Panel, StatusMessage, TextArea, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";
import type { ContentBlocks } from "@/shared/content/types";

/**
 * The content editor.
 *
 * Each section is edited and saved on its own, against its own schema, rather
 * than as one enormous form. That keeps a validation error in the events list
 * from blocking a one-word fix to the hero, and it means a failed save can
 * only ever affect the section it belongs to.
 */

type SectionKey = keyof ContentBlocks;

const SECTIONS: { key: SectionKey; label: string; description: string }[] = [
  { key: "hero", label: "Hero", description: "The first screen — headline, sub-heading, and button labels." },
  { key: "services", label: "Services", description: "The six discipline cards." },
  { key: "projects", label: "Projects", description: "Selected project case studies." },
  { key: "stats", label: "Statistics", description: "The counted figures in the 'by the numbers' band." },
  { key: "pillars", label: "Why Caldim", description: "The four differentiator cards." },
  { key: "events", label: "Events", description: "Conferences and webinars." },
  { key: "testimonials", label: "Testimonials", description: "Client quotes." },
  { key: "certifications", label: "Certifications", description: "The certification pills." },
  { key: "careers", label: "Careers", description: "Careers blurb and open roles." },
  { key: "offices", label: "Offices", description: "Office addresses in the contact section." },
  { key: "directContacts", label: "Direct contacts", description: "Named email contacts." },
];

export default function ContentEditor({ initial }: { initial: ContentBlocks }) {
  const router = useRouter();
  const api = createApiClient(useCsrfToken());

  const [content, setContent] = useState<ContentBlocks>(initial);
  const [active, setActive] = useState<SectionKey>("hero");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const update = <K extends SectionKey>(key: K, value: ContentBlocks[K]) => {
    setContent((current) => ({ ...current, [key]: value }));
    setStatus("idle");
    setMessage("");
  };

  const save = async (key: SectionKey) => {
    setStatus("saving");
    setMessage("Saving…");
    setFields({});

    const { ok, data } = await api("/api/admin/content", {
      method: "PUT",
      body: { key, value: content[key] },
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be saved.");
      setFields(data.fields ?? {});
      return;
    }

    setStatus("saved");
    setMessage("Published. The live site is updated.");
    router.refresh();
  };

  const revert = async (key: SectionKey) => {
    if (!window.confirm("Restore this section to the text the site shipped with?")) return;

    setStatus("saving");
    setMessage("Reverting…");

    const { ok, data } = await api(`/api/admin/content?key=${key}`, { method: "DELETE" });
    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That couldn't be reverted.");
      return;
    }

    setStatus("saved");
    setMessage("Reverted to the shipped default. Reload to see it here.");
    router.refresh();
  };

  const section = SECTIONS.find((item) => item.key === active)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav aria-label="Content sections">
        <ul className="flex flex-wrap gap-1 lg:flex-col">
          {SECTIONS.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => {
                  setActive(item.key);
                  setStatus("idle");
                  setMessage("");
                  setFields({});
                }}
                aria-current={active === item.key ? "true" : undefined}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === item.key
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-paper-dim hover:bg-steel-900 hover:text-paper"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-5">
        <Panel
          title={section.label}
          description={section.description}
          action={
            <button
              type="button"
              onClick={() => revert(active)}
              className="label-mono-sm inline-flex items-center gap-1.5 text-paper-dim transition-colors hover:text-accent"
            >
              <RotateCcw size={13} aria-hidden="true" />
              REVERT
            </button>
          }
        >
          <div className="space-y-5">
            <SectionFields
              sectionKey={active}
              content={content}
              update={update}
              fields={fields}
            />

            <div className="flex items-center gap-4 border-t border-blueprint pt-5">
              <Button onClick={() => save(active)} disabled={status === "saving"}>
                {status === "saving" ? "Publishing…" : "Publish changes"}
              </Button>
              <StatusMessage status={status} message={message} />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** Renders the right editor for whichever section is selected. */
function SectionFields({
  sectionKey,
  content,
  update,
  fields,
}: {
  sectionKey: SectionKey;
  content: ContentBlocks;
  update: <K extends SectionKey>(key: K, value: ContentBlocks[K]) => void;
  fields: Record<string, string>;
}) {
  switch (sectionKey) {
    case "hero": {
      const hero = content.hero;
      const set = (patch: Partial<typeof hero>) => update("hero", { ...hero, ...patch });
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" htmlFor="hero-eyebrow" error={fields.eyebrow} className="sm:col-span-2">
            <TextInput id="hero-eyebrow" value={hero.eyebrow} error={fields.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Headline, line 1" htmlFor="hero-h1" error={fields.headingLine1}>
            <TextInput id="hero-h1" value={hero.headingLine1} error={fields.headingLine1} onChange={(e) => set({ headingLine1: e.target.value })} />
          </Field>
          <Field label="Headline, line 2" htmlFor="hero-h2" error={fields.headingLine2}>
            <TextInput id="hero-h2" value={hero.headingLine2} error={fields.headingLine2} onChange={(e) => set({ headingLine2: e.target.value })} />
          </Field>
          <Field label="Sub-heading" htmlFor="hero-sub" error={fields.subheading} className="sm:col-span-2">
            <TextArea id="hero-sub" rows={3} value={hero.subheading} error={fields.subheading} onChange={(e) => set({ subheading: e.target.value })} />
          </Field>
          <Field label="Primary button" htmlFor="hero-cta1" error={fields.primaryCta}>
            <TextInput id="hero-cta1" value={hero.primaryCta} error={fields.primaryCta} onChange={(e) => set({ primaryCta: e.target.value })} />
          </Field>
          <Field label="Secondary button" htmlFor="hero-cta2" error={fields.secondaryCta}>
            <TextInput id="hero-cta2" value={hero.secondaryCta} error={fields.secondaryCta} onChange={(e) => set({ secondaryCta: e.target.value })} />
          </Field>
        </div>
      );
    }

    case "careers": {
      const careers = content.careers;
      return (
        <div className="space-y-4">
          <Field label="Blurb" htmlFor="careers-blurb" error={fields.blurb}>
            <TextArea id="careers-blurb" rows={4} value={careers.blurb} error={fields.blurb} onChange={(e) => update("careers", { ...careers, blurb: e.target.value })} />
          </Field>
          <StringList
            label="Open roles"
            values={careers.roles}
            onChange={(roles) => update("careers", { ...careers, roles })}
            placeholder="Structural Steel Detailer"
          />
        </div>
      );
    }

    case "certifications":
      return (
        <StringList
          label="Certifications"
          values={content.certifications}
          onChange={(value) => update("certifications", value)}
          placeholder="ISO 9001:2015 Quality Management"
        />
      );

    case "services":
      return (
        <RepeatingList
          items={content.services}
          onChange={(value) => update("services", value)}
          blank={{ id: "new-service", mark: "N1", title: "", summary: "", standard: "", deliverables: [] }}
          labelFor={(item) => item.title || "Untitled service"}
          render={(item, patch, index) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor={`svc-title-${index}`}>
                <TextInput id={`svc-title-${index}`} value={item.title} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field label="Part mark" htmlFor={`svc-mark-${index}`} hint="Two characters, e.g. S1.">
                <TextInput id={`svc-mark-${index}`} maxLength={6} value={item.mark} onChange={(e) => patch({ mark: e.target.value })} />
              </Field>
              <Field label="Summary" htmlFor={`svc-sum-${index}`} className="sm:col-span-2">
                <TextArea id={`svc-sum-${index}`} rows={3} value={item.summary} onChange={(e) => patch({ summary: e.target.value })} />
              </Field>
              <Field label="Standard" htmlFor={`svc-std-${index}`} className="sm:col-span-2">
                <TextInput id={`svc-std-${index}`} value={item.standard} onChange={(e) => patch({ standard: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <StringList
                  label="Deliverables"
                  values={item.deliverables}
                  onChange={(deliverables) => patch({ deliverables })}
                  placeholder="Shop drawings — single & multi-piece assemblies"
                />
              </div>
            </div>
          )}
        />
      );

    case "projects":
      return (
        <RepeatingList
          items={content.projects}
          onChange={(value) => update("projects", value)}
          blank={{ id: `project-${Date.now()}`, type: "", location: "", tons: "", drawings: "", connections: "", scheduleSaved: "", note: "" }}
          labelFor={(item) => item.type || "Untitled project"}
          render={(item, patch, index) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project type" htmlFor={`prj-type-${index}`}>
                <TextInput id={`prj-type-${index}`} value={item.type} onChange={(e) => patch({ type: e.target.value })} />
              </Field>
              <Field label="Location" htmlFor={`prj-loc-${index}`}>
                <TextInput id={`prj-loc-${index}`} value={item.location} onChange={(e) => patch({ location: e.target.value })} />
              </Field>
              <Field label="Tons detailed" htmlFor={`prj-tons-${index}`}>
                <TextInput id={`prj-tons-${index}`} value={item.tons} onChange={(e) => patch({ tons: e.target.value })} />
              </Field>
              <Field label="Drawings issued" htmlFor={`prj-dwg-${index}`}>
                <TextInput id={`prj-dwg-${index}`} value={item.drawings} onChange={(e) => patch({ drawings: e.target.value })} />
              </Field>
              <Field label="Connections designed" htmlFor={`prj-conn-${index}`}>
                <TextInput id={`prj-conn-${index}`} value={item.connections} onChange={(e) => patch({ connections: e.target.value })} />
              </Field>
              <Field label="Schedule saved" htmlFor={`prj-sched-${index}`}>
                <TextInput id={`prj-sched-${index}`} value={item.scheduleSaved} onChange={(e) => patch({ scheduleSaved: e.target.value })} />
              </Field>
              <Field label="Note" htmlFor={`prj-note-${index}`} className="sm:col-span-2">
                <TextArea id={`prj-note-${index}`} rows={3} value={item.note} onChange={(e) => patch({ note: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    case "stats":
      return (
        <RepeatingList
          items={content.stats}
          onChange={(value) => update("stats", value)}
          blank={{ value: 0, suffix: "+", label: "" }}
          labelFor={(item) => item.label || "Untitled figure"}
          render={(item, patch, index) => (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Value" htmlFor={`stat-val-${index}`} hint="Digits only — the site formats it.">
                <TextInput id={`stat-val-${index}`} type="number" min={0} value={item.value} onChange={(e) => patch({ value: Number(e.target.value) })} />
              </Field>
              <Field label="Suffix" htmlFor={`stat-sfx-${index}`}>
                <TextInput id={`stat-sfx-${index}`} maxLength={6} value={item.suffix} onChange={(e) => patch({ suffix: e.target.value })} />
              </Field>
              <Field label="Label" htmlFor={`stat-lbl-${index}`}>
                <TextInput id={`stat-lbl-${index}`} value={item.label} onChange={(e) => patch({ label: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    case "pillars":
      return (
        <RepeatingList
          items={content.pillars}
          onChange={(value) => update("pillars", value)}
          blank={{ title: "", stat: "", description: "" }}
          labelFor={(item) => item.title || "Untitled pillar"}
          render={(item, patch, index) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor={`pil-title-${index}`}>
                <TextInput id={`pil-title-${index}`} value={item.title} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field label="Headline figure" htmlFor={`pil-stat-${index}`}>
                <TextInput id={`pil-stat-${index}`} value={item.stat} onChange={(e) => patch({ stat: e.target.value })} />
              </Field>
              <Field label="Description" htmlFor={`pil-desc-${index}`} className="sm:col-span-2">
                <TextArea id={`pil-desc-${index}`} rows={3} value={item.description} onChange={(e) => patch({ description: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    case "events":
      return (
        <RepeatingList
          items={content.events}
          onChange={(value) => update("events", value)}
          blank={{ date: "", title: "", location: "", note: "" }}
          labelFor={(item) => item.title || "Untitled event"}
          render={(item, patch, index) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor={`evt-date-${index}`} hint="Free text, e.g. 'March 2026'.">
                <TextInput id={`evt-date-${index}`} value={item.date} onChange={(e) => patch({ date: e.target.value })} />
              </Field>
              <Field label="Title" htmlFor={`evt-title-${index}`}>
                <TextInput id={`evt-title-${index}`} value={item.title} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field label="Location" htmlFor={`evt-loc-${index}`}>
                <TextInput id={`evt-loc-${index}`} value={item.location} onChange={(e) => patch({ location: e.target.value })} />
              </Field>
              <Field label="Note" htmlFor={`evt-note-${index}`} className="sm:col-span-2">
                <TextArea id={`evt-note-${index}`} rows={2} value={item.note} onChange={(e) => patch({ note: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    case "testimonials":
      return (
        <RepeatingList
          items={content.testimonials}
          onChange={(value) => update("testimonials", value)}
          blank={{ quote: "", attribution: "" }}
          labelFor={(item) => item.attribution || "Unattributed quote"}
          render={(item, patch, index) => (
            <div className="space-y-4">
              <Field label="Quote" htmlFor={`tst-quote-${index}`}>
                <TextArea id={`tst-quote-${index}`} rows={3} value={item.quote} onChange={(e) => patch({ quote: e.target.value })} />
              </Field>
              <Field label="Attribution" htmlFor={`tst-attr-${index}`} hint="Name, title — company.">
                <TextInput id={`tst-attr-${index}`} value={item.attribution} onChange={(e) => patch({ attribution: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    case "offices":
      return (
        <RepeatingList
          items={content.offices}
          onChange={(value) => update("offices", value)}
          blank={{ city: "", address: "", name: "", phone: "", tag: "", isInternational: false }}
          labelFor={(item) => item.city || "Untitled office"}
          render={(item, patch, index) => (
            <div className="space-y-4">
              <Field label="Label" htmlFor={`off-city-${index}`}>
                <TextInput id={`off-city-${index}`} value={item.city} onChange={(e) => patch({ city: e.target.value })} />
              </Field>
              <Field label="Legal / Company Name" htmlFor={`off-name-${index}`}>
                <TextInput id={`off-name-${index}`} value={item.name ?? ""} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Address" htmlFor={`off-addr-${index}`} hint="Line breaks are preserved on the site.">
                <TextArea id={`off-addr-${index}`} rows={4} value={item.address} onChange={(e) => patch({ address: e.target.value })} />
              </Field>
              <Field label="Phone" htmlFor={`off-phone-${index}`}>
                <TextInput id={`off-phone-${index}`} value={item.phone ?? ""} onChange={(e) => patch({ phone: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    case "directContacts":
      return (
        <RepeatingList
          items={content.directContacts}
          onChange={(value) => update("directContacts", value)}
          blank={{ name: "", email: "" }}
          labelFor={(item) => item.name || "Unnamed contact"}
          render={(item, patch, index) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor={`dc-name-${index}`}>
                <TextInput id={`dc-name-${index}`} value={item.name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor={`dc-email-${index}`}>
                <TextInput id={`dc-email-${index}`} type="email" value={item.email} onChange={(e) => patch({ email: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );

    default:
      return null;
  }
}

/** A add/remove/reorder list of plain strings. */
function StringList({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  return (
    <fieldset>
      <legend className="label-mono-sm mb-2 text-paper-dim">{label}</legend>
      <ul className="space-y-2">
        {values.map((value, index) => (
          <li key={index} className="flex gap-2">
            <TextInput
              value={value}
              placeholder={placeholder}
              aria-label={`${label} item ${index + 1}`}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove item ${index + 1}`}
              className="shrink-0 rounded p-2 text-paper-dim transition-colors hover:text-red-400"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="mt-2 px-0" onClick={() => onChange([...values, ""])}>
        <Plus size={14} aria-hidden="true" />
        Add item
      </Button>
    </fieldset>
  );
}

/** A add/remove/reorder list of objects, each rendered by the caller. */
function RepeatingList<T>({
  items,
  onChange,
  blank,
  labelFor,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  labelFor: (item: T) => string;
  render: (item: T, patch: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const patch = (changes: Partial<T>) => {
          const next = [...items];
          next[index] = { ...items[index], ...changes };
          onChange(next);
        };

        const expanded = open === index;

        return (
          <div key={index} className="rounded-lg border border-blueprint">
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : index)}
                aria-expanded={expanded}
                className="flex-1 truncate text-left text-sm font-medium transition-colors hover:text-accent"
              >
                {labelFor(item)}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = [...items];
                  [next[index], next[index - 1]] = [next[index - 1], next[index]];
                  onChange(next);
                }}
                disabled={index === 0}
                aria-label="Move up"
                className="rounded p-1 text-paper-dim transition-colors hover:text-accent disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = [...items];
                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                  onChange(next);
                }}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="rounded p-1 text-paper-dim transition-colors hover:text-accent disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label={`Remove ${labelFor(item)}`}
                className="rounded p-1 text-paper-dim transition-colors hover:text-red-400"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
            {expanded && (
              <div className="border-t border-blueprint p-4">{render(item, patch, index)}</div>
            )}
          </div>
        );
      })}

      <Button
        variant="secondary"
        onClick={() => {
          onChange([...items, structuredClone(blank)]);
          setOpen(items.length);
        }}
      >
        <Plus size={14} aria-hidden="true" />
        Add entry
      </Button>
    </div>
  );
}
