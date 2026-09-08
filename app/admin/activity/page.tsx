import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import AdminShell from "@/frontend/components/admin/AdminShell";
import { Panel } from "@/frontend/components/admin/ui";
import { auditLogs, db } from "@/backend/db";
import { requireAdmin } from "@/backend/security/requireAdmin";

export const metadata: Metadata = { title: "Activity", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { user } = await requireAdmin();

  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <AdminShell
      user={user}
      title="Activity log"
      description="An append-only record of every privileged action — successful and failed. IP addresses are stored as salted hashes rather than in the clear, so the log is useful for spotting a pattern without holding personal data."
    >
      {rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-paper-dim">Nothing recorded yet.</p>
        </Panel>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-blueprint">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">
              Privileged actions, most recent first
            </caption>
            <thead>
              <tr className="border-b border-blueprint bg-steel-900/50 text-left">
                <th scope="col" className="label-mono-sm px-4 py-3 font-normal text-paper-dim">WHEN</th>
                <th scope="col" className="label-mono-sm px-4 py-3 font-normal text-paper-dim">ACTION</th>
                <th scope="col" className="label-mono-sm px-4 py-3 font-normal text-paper-dim">ACTOR</th>
                <th scope="col" className="label-mono-sm px-4 py-3 font-normal text-paper-dim">TARGET</th>
                <th scope="col" className="label-mono-sm px-4 py-3 font-normal text-paper-dim">RESULT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-blueprint/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-paper-dim">
                    <time dateTime={row.createdAt.toISOString()}>
                      {row.createdAt.toLocaleString("en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </time>
                  </td>
                  <td className="label-mono-sm px-4 py-2.5 text-accent">{row.action}</td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 text-paper-dim">
                    {row.actorInfo || "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-2.5 text-paper-dim">
                    {row.entity ? `${row.entity} ${row.entityId}`.trim() : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`label-mono-sm ${
                        row.outcome === "failure" ? "text-amber-400" : "text-paper-dim/70"
                      }`}
                    >
                      {row.outcome.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>);
}
