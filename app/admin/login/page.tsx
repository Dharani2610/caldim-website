import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/frontend/components/admin/LoginForm";
import AuthCard from "@/frontend/components/admin/AuthCard";
import { getSession } from "@/backend/security/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Already signed in? Don't show a login form — it invites re-authenticating
  // for no reason and makes a phished page look plausible.
  const auth = await getSession();
  if (auth) redirect("/admin");

  /**
   * Only same-site, absolute-path redirects are honoured. Without this check,
   * `?next=https://evil.example` would turn the sign-in page into an open
   * redirect that borrows this domain's credibility.
   */
  const next =
    searchParams.next && /^\/(?!\/)[\w\-/]*$/.test(searchParams.next)
      ? searchParams.next
      : "/admin";

  return (
    <AuthCard
      title="Sign in"
      subtitle="Caldim Engineering content administration."
    >
      <LoginForm next={next} />
    </AuthCard>);
}
