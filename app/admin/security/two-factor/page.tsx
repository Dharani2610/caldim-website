import type { Metadata } from "next";
import AuthCard from "@/frontend/components/admin/AuthCard";
import AdminShell from "@/frontend/components/admin/AdminShell";
import TotpSetup from "@/frontend/components/admin/TotpSetup";
import { requireAdmin } from "@/backend/security/requireAdmin";
import { env } from "@/backend/env";

export const metadata: Metadata = { title: "Two-factor", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TwoFactorPage() {
  const { user, session } = await requireAdmin({
    allowPartialAuth: true,
    allowPasswordChangePending: true,
  });

  const mandatory = env.requireTotp && !user.totpEnabled;
  const midSignIn = !session.fullyAuthenticated;

  // When 2FA is required and this account hasn't enrolled, there is nowhere
  // else to go — so it gets the standalone card, exactly like the forced
  // password change does.
  if (mandatory || midSignIn) {
    return (
      <AuthCard
        title="Set up two-factor authentication"
        subtitle="Scan the code with any authenticator app, then confirm with the 6-digit code it shows."
      >
        <TotpSetup enabled={user.totpEnabled} email={user.email} forced />
      </AuthCard>);
  }

  return (
    <AdminShell
      user={user}
      title="Two-factor authentication"
      description="A second factor means a stolen password on its own is not enough to reach this dashboard."
    >
      <div className="max-w-lg">
        <TotpSetup enabled={user.totpEnabled} email={user.email} />
      </div>
    </AdminShell>);
}
