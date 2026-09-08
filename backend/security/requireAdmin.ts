import "server-only";
import { redirect } from "next/navigation";
import type { AdminUser, Session } from "@/backend/db";
import { getSession } from "@/backend/security/session";
import { env } from "@/backend/env";

/**
 * The server-side gate for every admin page.
 *
 * Middleware only checks whether a session cookie is present, because the Edge
 * runtime can't reach the database. This is where the real decision is made,
 * and it deliberately re-checks on every render rather than trusting anything
 * carried over from a previous request.
 *
 * The order of the redirects matters: an account that still owes a second
 * factor, or is still on its seeded password, is sent to fix that before it
 * can reach anything else.
 */
export async function requireAdmin({
  allowPartialAuth = false,
  allowPasswordChangePending = false,
}: {
  /** Set on the 2FA challenge page itself, which by definition runs half-authenticated. */
  allowPartialAuth?: boolean;
  /** Set on the password screen, so it isn't caught by its own redirect. */
  allowPasswordChangePending?: boolean;
} = {}): Promise<{ user: AdminUser; session: Session }> {
  const auth = await getSession({ requireFullAuth: false });

  if (!auth) redirect("/admin/login");

  const { user, session } = auth;

  if (!session.fullyAuthenticated && !allowPartialAuth) {
    // Password accepted, second factor still outstanding.
    redirect(user.totpEnabled ? "/admin/verify" : "/admin/security/two-factor");
  }

  if (env.requireTotp && !user.totpEnabled && !allowPartialAuth) {
    redirect("/admin/security/two-factor");
  }

  if (user.mustChangePassword && !allowPasswordChangePending) {
    redirect("/admin/security/password");
  }

  return { user, session };
}

/** Returns the session without redirecting — for pages that adapt rather than gate. */
export async function optionalAdmin() {
  return getSession({ requireFullAuth: false });
}
