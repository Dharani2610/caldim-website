"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/frontend/components/admin/ui";
import { createApiClient, useCsrfToken } from "@/frontend/components/CsrfProvider";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const api = createApiClient(useCsrfToken());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const { ok, data } = await api<{ next?: string }>("/api/auth/login", {
        body: { email, password, website },
      });

      if (!ok) {
        setError(data.error ?? "Those credentials weren't recognised.");
        setPassword("");
        setBusy(false);
        return;
      }

      // The server decides where to go next — the 2FA challenge, the forced
      // password change, or the dashboard. The client never assumes.
      const destination = data.next ?? next;
      router.replace(destination === "/admin" ? next : destination);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@caldimengg.com"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      {/* Honeypot — hidden from people, present for bots. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Leave empty</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs leading-relaxed text-paper-dim/80">
        Repeated failed attempts temporarily lock the account. If you are locked
        out and have lost your recovery codes, an administrator can reset the
        account from the server console.
      </p>
    </form>
  );
}
