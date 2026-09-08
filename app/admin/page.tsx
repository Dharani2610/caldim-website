import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, count } from "drizzle-orm";
import {
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Inbox,
  ShieldAlert,
  Users,
} from "lucide-react";
import AdminShell from "@/frontend/components/admin/AdminShell";
import { Panel } from "@/frontend/components/admin/ui";
import { auditLogs, contactSubmissions, contentBlocks, db, leaders, mediaAssets, one } from "@/backend/db";
import { requireAdmin } from "@/backend/security/requireAdmin";
import { pruneExpiredSessions } from "@/backend/security/session";
import { pruneRateLimits } from "@/backend/security/rateLimit";

export const metadata: Metadata = { title: "Overview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function AdminDashboard() {
  const { user } = await requireAdmin();

  // Housekeeping on an authenticated page view: cheap, and it means expired
  // rows never accumulate without needing a separate cron job.
  pruneExpiredSessions();
  pruneRateLimits();

  const leaderCount = (await one(db.select({ value: count() }).from(leaders)))?.value ?? 0;
  const mediaCount = (await one(db.select({ value: count() }).from(mediaAssets)))?.value ?? 0;
  const enquiryCount = (await one(db.select({ value: count() }).from(contactSubmissions)))?.value ?? 0;
  const unhandledCount =
    (await one(db
      .select({ value: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.handled, false))
      ))?.value ?? 0;
  const editedBlocks = (await one(db.select({ value: count() }).from(contentBlocks)))?.value ?? 0;

  const recentFailures = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorInfo: auditLogs.actorInfo,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.outcome, "failure"))
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);

  const recentActivity = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorInfo: auditLogs.actorInfo,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);

  const cards = [
    { href: "/admin/leadership", label: "Leadership entries", value: leaderCount, icon: Users },
    { href: "/admin/content", label: "Edited sections", value: editedBlocks, icon: FileText },
    { href: "/admin/media", label: "Media files", value: mediaCount, icon: ImageIcon },
    { href: "/admin/enquiries", label: "Enquiries", value: enquiryCount, icon: Inbox, badge: unhandledCount },
  ];

  return (
    <AdminShell user={user} title={`Welcome back, ${user.name.split(" ")[0]}`}>
      <div className="space-y-6">
        {!user.totpEnabled && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-amber-200">
                Two-factor authentication is off for your account.
              </p>
              <p className="mt-1 text-sm text-paper-dim">
                Your password is currently the only thing standing between a
                phishing email and this dashboard.{" "}
                <Link href="/admin/security/two-factor" className="text-accent underline underline-offset-4">
                  Turn on two-factor
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {leaderCount === 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blueprint bg-steel-900/40 p-4">
            <Users size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">The leadership section is showing placeholders.</p>
              <p className="mt-1 text-sm text-paper-dim">
                The public page falls back to four placeholder entries until you
                add real people.{" "}
                <Link href="/admin/leadership" className="text-accent underline underline-offset-4">
                  Add your leadership team
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="card-surface rounded-xl border border-blueprint bg-steel-900/30 p-5 transition-colors hover:border-accent/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Icon size={16} className="text-accent" aria-hidden="true" />
                  {card.badge ? (
                    <span className="label-mono-sm rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                      {card.badge} new
                    </span>
                  ) : null}
                </div>
                <p className="font-display text-2xl font-semibold tabular-nums">{card.value}</p>
                <p className="label-mono-sm mt-1 text-paper-dim">{card.label}</p>
              </Link>);
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Recent activity" description="Every change made through this dashboard.">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-paper-dim">Nothing recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="min-w-0">
                      <span className="label-mono-sm text-accent">{entry.action}</span>{" "}
                      <span className="text-paper-dim">{entry.actorInfo || entry.entityId}</span>
                    </span>
                    <span className="label-mono-sm shrink-0 text-paper-dim/70">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/activity"
              className="label-mono-sm mt-5 inline-block text-paper-dim transition-colors hover:text-accent"
            >
              VIEW FULL LOG →
            </Link>
          </Panel>

          <Panel
            title="Security events"
            description="Failed sign-ins, rejected requests, and lockouts."
          >
            {recentFailures.length === 0 ? (
              <p className="text-sm text-paper-dim">
                No failed attempts recorded. That is the answer you want here.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentFailures.map((entry) => (
                  <li key={entry.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <AlertTriangle size={13} className="shrink-0 text-amber-400" aria-hidden="true" />
                      <span className="label-mono-sm text-amber-300">{entry.action}</span>
                      <span className="truncate text-paper-dim">{entry.actorInfo}</span>
                    </span>
                    <span className="label-mono-sm shrink-0 text-paper-dim/70">
                      {timeAgo(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>);
}
