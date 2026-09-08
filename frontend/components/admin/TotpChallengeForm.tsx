"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

export default function TotpChallengeForm() {
  const router = useRouter();
  const api = createApiClient(useCsrfToken());

  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const { ok, data } = await api<{ next?: string; usedRecovery?: boolean }>("/api/auth/totp", {
        body: { code, mode },
      });

      if (!ok) {
        setError(data.error ?? "That code wasn't accepted.");
        setCode("");
        setBusy(false);
        return;
      }

      router.replace(data.next ?? "/admin");
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field
        label={mode === "totp" ? "Authentication code" : "Recovery code"}
        htmlFor="code"
        hint={
          mode === "totp"
            ? "The code rotates every 30 seconds."
            : "Each recovery code works once. Using one signs out your other sessions."
        }
      >
        <TextInput
          id="code"
          name="code"
          // A one-time code should never be offered from a password manager's
          // saved-password list, but should accept an SMS/app autofill.
          autoComplete="one-time-code"
          inputMode={mode === "totp" ? "numeric" : "text"}
          required
          autoFocus
          maxLength={mode === "totp" ? 6 : 14}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={mode === "totp" ? "123456" : "ABCDE-FGHIJ"}
          className={mode === "totp" ? "text-center font-mono text-lg tracking-[0.4em]" : "text-center font-mono"}
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Verifying…" : "Verify"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "totp" ? "recovery" : "totp");
          setCode("");
          setError("");
        }}
        className="w-full text-center text-xs text-paper-dim underline-offset-4 transition-colors hover:text-accent hover:underline"
      >
        {mode === "totp" ? "Use a recovery code instead" : "Use my authenticator app instead"}
      </button>
    </form>
  );
}
