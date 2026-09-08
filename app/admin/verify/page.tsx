import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/frontend/components/admin/AuthCard";
import TotpChallengeForm from "@/frontend/components/admin/TotpChallengeForm";
import { getSession } from "@/backend/security/session";

export const metadata: Metadata = { title: "Verify", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The second-factor challenge. This is the one page that renders for a
 * half-authenticated session — everything else refuses one.
 */
export default async function VerifyPage() {
  const auth = await getSession({ requireFullAuth: false });
  if (!auth) redirect("/admin/login");
  if (auth.session.fullyAuthenticated) redirect("/admin");
  if (!auth.user.totpEnabled) redirect("/admin/security/two-factor");

  return (
    <AuthCard
      title="Two-factor verification"
      subtitle={`Enter the 6-digit code from your authenticator app for ${auth.user.email}.`}
    >
      <TotpChallengeForm />
    </AuthCard>);
}
