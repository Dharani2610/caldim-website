import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { Paperclip } from "lucide-react";
import AdminShell from "@/frontend/components/admin/AdminShell";
import { Panel } from "@/frontend/components/admin/ui";
import { contactSubmissions, db } from "@/backend/db";
import { requireAdmin } from "@/backend/security/requireAdmin";

export const metadata: Metadata = { title: "Enquiries", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const { user } = await requireAdmin();

  const rows = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(100);

  return (
    <AdminShell
      user={user}
      title="Enquiries"
      description="Every RFQ submitted through the website, stored here as well as emailed — so an outage at the mail provider never loses one."
    >
      {rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-paper-dim">No enquiries yet.</p>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id}>
              <Panel>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {row.name}
                      <span className="text-paper-dim"> · {row.company}</span>
                    </p>
                    <a
                      href={`mailto:${row.email}`}
                      className="label-mono-sm text-accent underline-offset-4 hover:underline"
                    >
                      {row.email}
                    </a>
                  </div>
                  <time
                    dateTime={row.createdAt.toISOString()}
                    className="label-mono-sm text-paper-dim/80"
                  >
                    {row.createdAt.toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-blueprint pt-3 text-sm sm:grid-cols-4">
                  {[
                    ["Role", row.role],
                    ["Service", row.projectType],
                    ["Tonnage", row.tonnage],
                    ["Timeline", row.timeline],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt className="label-mono-sm text-paper-dim/80">{label}</dt>
                        <dd className="mt-0.5">{value}</dd>
                      </div>
                    ))}
                </dl>

                {row.message && (
                  <p className="mt-4 whitespace-pre-line border-t border-blueprint pt-3 text-sm leading-relaxed text-paper-dim">
                    {row.message}
                  </p>
                )}

                {row.attachmentId && (
                  <p className="label-mono-sm mt-3 inline-flex items-center gap-1.5 text-paper-dim">
                    <Paperclip size={12} aria-hidden="true" />
                    ATTACHMENT RECEIVED — STORED ON THE SERVER
                  </p>
                )}
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>);
}
