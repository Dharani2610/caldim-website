import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-steel-950 px-6">
      <div className="max-w-md text-center">
        <p className="label-mono text-accent">ERROR 404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-paper">
          That sheet isn&apos;t in this package.
        </h1>
        <p className="mt-4 leading-relaxed text-paper-dim">
          The page you were looking for doesn&apos;t exist, or has moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl border border-btn-solid bg-accent px-6 py-3 text-sm font-medium text-steel-950 transition-colors hover:bg-accent/90"
        >
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}
