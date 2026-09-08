import { audit } from "@/backend/security/audit";
import { verifyCsrf } from "@/backend/security/csrf";
import { jsonError, jsonOk } from "@/backend/security/guard";
import { destroySession, getSession } from "@/backend/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sign-out. Still CSRF-protected: forcing someone out of their session is a
 * small attack, but it is an attack.
 */
export async function POST(request: Request) {
  if (verifyCsrf(request)) {
    return jsonError("Request rejected. Reload the page and try again.", 403);
  }

  // A half-authenticated session (password accepted, 2FA pending) must be
  // able to sign out too, so don't require full auth here.
  const auth = await getSession({ requireFullAuth: false });
  await destroySession();

  if (auth) {
    await audit({ action: "logout", userId: auth.user.id, actorInfo: auth.user.email });
  }

  return jsonOk({ next: "/admin/login" });
}
