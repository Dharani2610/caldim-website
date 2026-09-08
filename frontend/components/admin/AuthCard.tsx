import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The frame around every unauthenticated screen — sign-in, the 2FA challenge,
 * and the forced password change. Keeping them visually identical matters:
 * a consistent shell is one of the few cues a user has that they are on the
 * real sign-in page and not a copy of it.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-steel-950 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bp-grid opacity-[0.08]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--color-glow) / 0.16), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/images/caldim-logo.png"
            alt=""
            width={32}
            height={30}
            className="h-10 w-auto"
            priority
          />
          <span className="font-display text-lg font-semibold text-paper">
            CALDIM<span className="font-normal text-paper-dim"> ENGINEERING</span>
          </span>
        </div>

        <div className="card-surface rounded-2xl border border-blueprint bg-steel-900/60 p-7 backdrop-blur-sm md:p-8">
          <h1 className="font-display text-xl font-semibold text-paper">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-paper-dim">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </div>
  );
}
