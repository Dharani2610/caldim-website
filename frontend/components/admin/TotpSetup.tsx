"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Button, Field, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

export default function TotpSetup({
  enabled,
  email,
  forced = false,
}: {
  enabled: boolean;
  email: string;
  forced?: boolean;
}) {
  const router = useRouter();
  const token = useCsrfToken();
  const api = createApiClient(token);

  const [qr, setQr] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const loadSecret = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/auth/totp/enrol", { cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        qrDataUrl?: string;
        manualKey?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Setup couldn't be started.");
        return;
      }
      setQr(data.qrDataUrl ?? "");
      setManualKey(data.manualKey ?? "");
    } catch {
      setError("We couldn't reach the server.");
    }
  }, []);

  useEffect(() => {
    if (!enabled) void loadSecret();
  }, [enabled, loadSecret]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await api<{ recoveryCodes?: string[] }>("/api/auth/totp/enrol", {
        body: { code },
      });
      if (!ok) {
        setError(data.error ?? "That code wasn't accepted.");
        setCode("");
        setBusy(false);
        return;
      }
      // Shown exactly once — the server keeps only their hashes.
      setRecoveryCodes(data.recoveryCodes ?? []);
      setBusy(false);
    } catch {
      setError("We couldn't reach the server.");
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await api("/api/auth/totp/enrol", {
        method: "DELETE",
        body: { password: disablePassword },
      });
      if (!ok) {
        setError(data.error ?? "That password wasn't recognised.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server.");
      setBusy(false);
    }
  };

  // ── Recovery codes, shown once after enrolment ──────────────────────────
  if (recoveryCodes) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck size={18} aria-hidden="true" />
          <p className="font-medium">Two-factor authentication is on.</p>
        </div>

        <p className="text-sm leading-relaxed text-paper-dim">
          Save these recovery codes somewhere safe and offline. Each one works
          once, and they are the only way back in if you lose your
          authenticator. <strong className="text-paper">They will not be shown again.</strong>
        </p>

        <ul className="grid grid-cols-2 gap-2 rounded-lg border border-blueprint bg-steel-950 p-4 font-mono text-sm">
          {recoveryCodes.map((recoveryCode) => (
            <li key={recoveryCode} className="text-paper">{recoveryCode}</li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(recoveryCodes.join("\n"));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setError("Copying failed — select the codes and copy them manually.");
              }
            }}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copied ? "Copied" : "Copy codes"}
          </Button>
          <Button
            onClick={() => {
              router.replace("/admin");
              router.refresh();
            }}
          >
            I&apos;ve saved them — continue
          </Button>
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  // ── Already enabled ────────────────────────────────────────────────────
  if (enabled) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck size={18} aria-hidden="true" />
          <p className="font-medium">Two-factor authentication is on for {email}.</p>
        </div>

        {!showDisable ? (
          <Button variant="danger" onClick={() => setShowDisable(true)}>
            Turn off two-factor
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-paper-dim">
              Turning this off leaves your password as the only thing protecting
              the dashboard. Confirm with your password to continue.
            </p>
            <Field label="Your password" htmlFor="disablePassword">
              <TextInput
                id="disablePassword"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
              />
            </Field>
            <div className="flex gap-3">
              <Button variant="danger" onClick={disable} disabled={busy || !disablePassword}>
                {busy ? "Turning off…" : "Turn off two-factor"}
              </Button>
              <Button variant="ghost" onClick={() => setShowDisable(false)}>
                Cancel
              </Button>
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          </div>
        )}
      </div>
    );
  }

  // ── Enrolment ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {qr ? (
        <div className="flex flex-col items-center gap-4">
          <img
            src={qr}
            alt="QR code for setting up two-factor authentication"
            width={200}
            height={200}
            className="rounded-lg border border-blueprint bg-white p-2"
          />
          <details className="w-full">
            <summary className="cursor-pointer text-center text-xs text-paper-dim hover:text-accent">
              Can&apos;t scan? Enter the key manually
            </summary>
            <p className="mt-2 break-all rounded-lg border border-blueprint bg-steel-950 p-3 text-center font-mono text-xs text-paper">
              {manualKey}
            </p>
          </details>
        </div>
      ) : (
        <p className="text-center text-sm text-paper-dim">Preparing setup…</p>
      )}

      <Field
        label="Confirmation code"
        htmlFor="totpCode"
        hint="Enter the 6-digit code your authenticator app is showing now."
      >
        <TextInput
          id="totpCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="123456"
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button onClick={confirm} disabled={busy || code.length !== 6} className={forced ? "w-full" : ""}>
        {busy ? "Confirming…" : "Turn on two-factor"}
      </Button>
    </div>
  );
}
