"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Monitor } from "lucide-react";
import { Button, Panel, StatusMessage } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

interface SessionRow {
  id: string;
  userAgent: string;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
}

/**
 * Turns a user-agent string into something a person can recognise. It is only
 * a hint — the point is that someone can tell "my laptop" from "a browser I
 * have never used", not that the parsing is exhaustive.
 */
function describe(userAgent: string): string {
  if (!userAgent) return "Unknown device";

  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /OPR\//.test(userAgent) ? "Opera"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : "Browser";

  const platform =
    /Windows/.test(userAgent) ? "Windows"
    : /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad/.test(userAgent) ? "iOS"
    : /Mac OS X/.test(userAgent) ? "macOS"
    : /Linux/.test(userAgent) ? "Linux"
    : "";

  return platform ? `${browser} on ${platform}` : browser;
}

export default function SessionList({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const api = createApiClient(useCsrfToken());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const others = sessions.filter((session) => !session.current).length;

  const revokeAll = async () => {
    if (!window.confirm("Sign out every other device signed in as you?")) return;

    setStatus("saving");
    setMessage("Signing out other sessions…");

    const { ok, data } = await api<{ revoked?: number }>("/api/auth/sessions", {
      method: "DELETE",
    });

    if (!ok) {
      setStatus("error");
      setMessage(data.error ?? "That didn't work.");
      return;
    }

    setStatus("saved");
    setMessage(`Signed out ${data.revoked ?? 0} session${data.revoked === 1 ? "" : "s"}.`);
    router.refresh();
  };

  return (
    <Panel
      title="Active sessions"
      description="Every browser currently signed in as you. If you don't recognise one, sign them all out and change your password."
      action={
        others > 0 ? (
          <Button variant="danger" onClick={revokeAll} disabled={status === "saving"}>
            Sign out other sessions
          </Button>
        ) : null
      }
    >
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center gap-3 rounded-lg border border-blueprint px-4 py-3"
          >
            <Monitor size={16} className="shrink-0 text-paper-dim" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {describe(session.userAgent)}
                {session.current && <span className="ml-2 text-accent">· this device</span>}
              </p>
              <p className="label-mono-sm text-paper-dim/80">
                Last active{" "}
                <time dateTime={session.lastSeenAt}>
                  {new Date(session.lastSeenAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <StatusMessage status={status} message={message} />
      </div>
    </Panel>
  );
}
