"use client";

import { useEffect } from "react";

/**
 * The error boundary shows a generic message and never renders `error.message`.
 * A stack trace or an ORM error string in the browser is free reconnaissance;
 * the digest is enough to correlate a report with the server log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error.digest ?? error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-steel-950 px-6">
      <div className="max-w-md text-center">
        <p className="label-mono text-accent">SOMETHING BROKE</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-paper">
          We hit an error rendering this page.
        </h1>
        <p className="mt-4 leading-relaxed text-paper-dim">
          It has been logged. Try again, and if it keeps happening, email us at{" "}
          <a href="mailto:quotes@caldimengg.com" className="text-accent underline underline-offset-4">
            quotes@caldimengg.com
          </a>
          .
        </p>
        {error.digest && (
          <p className="label-mono-sm mt-4 text-paper-dim/70">REFERENCE {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-block rounded-xl border border-btn-solid bg-accent px-6 py-3 text-sm font-medium text-steel-950 transition-colors hover:bg-accent/90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
