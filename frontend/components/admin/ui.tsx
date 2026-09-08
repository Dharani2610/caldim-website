"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/**
 * The small set of form primitives the admin screens share.
 *
 * Every field wires up its own label, error id, and `aria-invalid`, because
 * doing that by hand at each call site is exactly how an admin form ends up
 * with inputs a screen reader can't describe.
 */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label-mono-sm mb-2 block text-paper-dim">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-paper-dim/80">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const baseInput =
  "w-full rounded-xl border border-blueprint bg-steel-900/50 px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-paper-dim/50 focus:border-accent disabled:opacity-60";

export function TextInput({
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`${baseInput} ${error ? "border-red-400/70" : ""} ${props.className ?? ""}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${props.id}-error` : props["aria-describedby"]}
    />
  );
}

export function TextArea({
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      {...props}
      className={`${baseInput} ${error ? "border-red-400/70" : ""} ${props.className ?? ""}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${props.id}-error` : props["aria-describedby"]}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: "bg-accent text-steel-950 hover:bg-accent/90 border border-transparent",
    secondary: "border border-blueprint-light text-paper hover:border-accent hover:text-accent",
    danger: "border border-red-500/50 text-red-400 hover:bg-red-500/10",
    ghost: "text-paper-dim hover:text-accent",
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  description,
  children,
  action,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-blueprint bg-steel-900/30 p-5 md:p-6">
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-paper-dim">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A single status line for a screen. `role="status"` with `aria-live="polite"`
 * means a save confirmation is announced without stealing focus.
 */
export function StatusMessage({
  status,
  message,
}: {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
}) {
  if (status === "idle" || !message) {
    return (
      <p role="status" aria-live="polite" className="sr-only">
        {message ?? ""}
      </p>
    );
  }

  const tone =
    status === "error" ? "text-red-400" : status === "saved" ? "text-accent" : "text-paper-dim";

  return (
    <p role="status" aria-live="polite" className={`label-mono-sm ${tone}`}>
      {message}
    </p>
  );
}
