import type { Metadata } from "next";
import AuthCard from "@/frontend/components/admin/AuthCard";
import AdminShell from "@/frontend/components/admin/AdminShell";
import PasswordForm from "@/frontend/components/admin/PasswordForm";
import { requireAdmin } from "@/backend/security/requireAdmin";

export const metadata: Metadata = { title: "Password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const { user } = await requireAdmin({
    allowPartialAuth: true,
    allowPasswordChangePending: true,
  });

  // A seeded account is sent straight here and has nowhere else to go, so it
  // gets the standalone card rather than the full dashboard chrome.
  if (user.mustChangePassword) {
    return (
      <AuthCard
        title="Choose a new password"
        subtitle="This account is still using the temporary password created during setup. Replace it before continuing."
      >
        <PasswordForm forced />
      </AuthCard>);
  }

  return (
    <AdminShell
      user={user}
      title="Change password"
      description="Changing your password signs out every other session automatically."
    >
      <div className="max-w-md">
        <PasswordForm />
      </div>
    </AdminShell>);
}
