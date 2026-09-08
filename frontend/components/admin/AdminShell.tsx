"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity,
  FileText,
  Image as ImageIcon,
  GalleryHorizontal,
  Inbox,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { useCsrfToken } from "@/frontend/components/CsrfProvider";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/leadership", label: "Leadership", icon: Users },
  { href: "/admin/content", label: "Site content", icon: FileText },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/gallery", label: "Gallery", icon: GalleryHorizontal },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/security", label: "Security", icon: Shield },
];

export default function AdminShell({
  children,
  user,
  title,
  description,
}: {
  children: ReactNode;
  user: { name: string; email: string; role: string };
  title: string;
  description?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-caldim-csrf": csrfToken },
      });
    } finally {
      // `replace` rather than `push`, so Back doesn't return to a page that
      // renders stale content from the bfcache after signing out.
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-steel-950 text-paper">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-10 lg:px-10 lg:py-10">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="mb-8 flex items-center justify-between lg:block">
            <div>
              <p className="label-mono-sm text-accent">CALDIM</p>
              <p className="font-display text-lg font-semibold">Admin</p>
            </div>
          </div>

          <nav aria-label="Admin sections" className="mb-8">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              {NAV.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-accent/10 font-medium text-accent"
                          : "text-paper-dim hover:bg-steel-900 hover:text-paper"
                      }`}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="rounded-xl border border-blueprint p-4">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="label-mono-sm truncate text-paper-dim">{user.email}</p>
            <p className="label-mono-sm mt-1 text-accent">{user.role.toUpperCase()}</p>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="mt-3 inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-accent disabled:opacity-60"
            >
              <LogOut size={14} aria-hidden="true" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>

          <Link
            href="/"
            className="label-mono-sm mt-4 inline-block text-paper-dim transition-colors hover:text-accent"
          >
            ← VIEW SITE
          </Link>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-8 border-b border-blueprint pb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm text-paper-dim">{description}</p>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
