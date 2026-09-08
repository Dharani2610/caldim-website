import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import AdminShell from "@/frontend/components/admin/AdminShell";
import { Panel } from "@/frontend/components/admin/ui";
import SessionList from "@/frontend/components/admin/SessionList";
import { db, sessions } from "@/backend/db";
import { requireAdmin } from "@/backend/security/requireAdmin";

export const metadata: Metadata = { title: "Security", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const { user, session } = await requireAdmin();

  const live = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      lastSeenAt: sessions.lastSeenAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(
      and(eq(sessions.userId, user.id), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))
    )
    .orderBy(desc(sessions.lastSeenAt));

  return (
    <AdminShell
      user={user}
      title="Security"
      description="Your account's protections, and the devices currently signed in as you."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Two-factor authentication">
          <div className="flex items-start gap-3">
            {user.totpEnabled ? (
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            ) : (
              <ShieldOff size={20} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-medium">
                {user.totpEnabled ? "On" : "Off"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-paper-dim">
                {user.totpEnabled
                  ? "A stolen password on its own isn't enough to reach this dashboard."
                  : "Your password is currently the only thing protecting this dashboard. A single phishing email is all it takes."}
              </p>
              <Link
                href="/admin/security/two-factor"
                className="mt-3 inline-block text-sm text-accent underline underline-offset-4"
              >
                {user.totpEnabled ? "Manage two-factor" : "Turn on two-factor"}
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title="Password">
          <div className="flex items-start gap-3">
            <KeyRound size={20} className="mt-0.5 shrink-0 text-paper-dim" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">
                Last changed{" "}
                {user.passwordChangedAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-paper-dim">
                Changing your password signs out every other session
                automatically — which is what you want if you suspect one is
                not yours.
              </p>
              <Link
                href="/admin/security/password"
                className="mt-3 inline-block text-sm text-accent underline underline-offset-4"
              >
                Change password
              </Link>
            </div>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <SessionList
            sessions={live.map((row) => ({
              id: row.id,
              userAgent: row.userAgent ?? "",
              lastSeenAt: row.lastSeenAt.toISOString(),
              createdAt: row.createdAt.toISOString(),
              current: row.id === session.id,
            }))}
          />
        </div>
      </div>
    </AdminShell>);
}
