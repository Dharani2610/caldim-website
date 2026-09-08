"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

/**
 * A rough strength read-out.
 *
 * Deliberately advisory, not a gate — the server enforces the real policy.
 * Its job is to tell someone their passphrase is short *before* they submit,
 * and to reward length rather than demanding a symbol they'll forget.
 */
function strengthOf(value: string): { score: number; label: string } {
  if (!value) return { score: 0, label: "" };

  let score = 0;
  if (value.length >= 12) score += 1;
  if (value.length >= 16) score += 1;
  if (value.length >= 22) score += 1;
  if (new Set(value).size >= 12) score += 1;

  const labels = ["Too short", "Weak", "Reasonable", "Strong", "Very strong"];
  return { score, label: labels[Math.min(score, 4)] };
}

export default function PasswordForm({ forced = false }: { forced?: boolean }) {
  const router = useRouter();
  const api = createApiClient(useCsrfToken());

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => strengthOf(newPassword), [newPassword]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFields({});
    setDone("");

    try {
      const { ok, data } = await api<{ next?: string; revokedSessions?: number }>(
        "/api/auth/password",
        { body: { currentPassword, newPassword, confirmPassword } }
      );

      if (!ok) {
        setError(data.error ?? "That didn't work.");
        setFields(data.fields ?? {});
        setBusy(false);
        return;
      }

      setDone(
        data.revokedSessions
          ? `Password updated. ${data.revokedSessions} other session${
              data.revokedSessions === 1 ? "" : "s"
            } signed out.`
          : "Password updated."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (forced) {
        router.replace(data.next ?? "/admin");
        router.refresh();
      } else {
        setBusy(false);
      }
    } catch {
      setError("We couldn't reach the server. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Current password" htmlFor="currentPassword" error={fields.currentPassword}>
        <TextInput
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          error={fields.currentPassword}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        error={fields.newPassword}
        hint="At least 12 characters. A short phrase you'll remember beats a short string you won't."
      >
        <TextInput
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          error={fields.newPassword}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        {newPassword && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-1 flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-full flex-1 rounded-full transition-colors ${
                    index < strength.score ? "bg-accent" : "bg-blueprint"
                  }`}
                />
              ))}
            </div>
            <span className="label-mono-sm text-paper-dim">{strength.label}</span>
          </div>
        )}
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword" error={fields.confirmPassword}>
        <TextInput
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={fields.confirmPassword}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-sm text-accent">
          {done}
        </p>
      )}

      <Button type="submit" disabled={busy} className={forced ? "w-full" : ""}>
        {busy ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
