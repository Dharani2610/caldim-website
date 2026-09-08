"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Carries the CSRF token from the server render down to the forms that need
 * it, so no component has to reach into `document.cookie` and every mutating
 * request sends the same value.
 */
const CsrfContext = createContext<string>("");

export function CsrfProvider({ token, children }: { token: string; children: ReactNode }) {
  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

export function useCsrfToken(): string {
  return useContext(CsrfContext);
}

/**
 * `fetch` with the CSRF header and JSON body already set — the single way the
 * client talks to a mutating endpoint. Anything that skips it gets a 403,
 * which is the intended failure mode: it makes the omission loud.
 */
export function createApiClient(token: string) {
  return async function api<T = unknown>(
    url: string,
    options: { method?: string; body?: unknown; signal?: AbortSignal } = {}
  ): Promise<{ ok: boolean; status: number; data: T & { error?: string; fields?: Record<string, string> } }> {
    const { method = "POST", body, signal } = options;

    const isFormData = body instanceof FormData;

    const response = await fetch(url, {
      method,
      signal,
      headers: {
        "x-caldim-csrf": token,
        ...(isFormData || body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
      // Never let a mutating admin response be served from cache.
      cache: "no-store",
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      error?: string;
      fields?: Record<string, string>;
    };

    return { ok: response.ok, status: response.status, data };
  };
}
