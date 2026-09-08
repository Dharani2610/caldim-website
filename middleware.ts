import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: security headers on every response, a CSRF token for every
 * visitor, and a cheap gate in front of /admin.
 *
 * This runs in the Edge runtime, so it can't reach the database. The admin
 * gate here is only a redirect for visitors with no session cookie at all —
 * the real check (is the token valid, is the session live, has 2FA been
 * satisfied) happens in the admin layout and in every route handler, where the
 * database is available. Middleware is a convenience, never the authority.
 */

const SESSION_COOKIES = ["__Host-caldim_session", "caldim_session"];

/**
 * Cookies are writable here but not in a Server Component, which is why the
 * CSRF token is minted at this layer. The `__Host-` prefix is browser-enforced:
 * the cookie must be Secure, path=/, and carry no Domain attribute, so a
 * sibling subdomain cannot overwrite it. Over plain HTTP the prefix is
 * rejected outright, so local development uses the bare name.
 */
function csrfCookieName(secure: boolean): string {
  return secure ? "__Host-caldim_csrf" : "caldim_csrf";
}

function isWellFormedCsrfToken(token: string | undefined): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{40,64}$/.test(token);
}

function mintCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // base64url, without depending on Buffer (absent in the Edge runtime).
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * A per-response nonce lets the CSP allow exactly the scripts this page
 * emitted, without 'unsafe-inline'. `strict-dynamic` then lets those trusted
 * scripts load their own chunks, which is what Next's runtime needs.
 */
/**
 * Cloudinary's two hosts, kept apart on purpose.
 *
 * `res.cloudinary.com` only ever *serves* bytes, so it is trusted to supply
 * images and video and nothing else. `api.cloudinary.com` accepts uploads, so
 * it appears in `connect-src` alone — a page can POST a video to it, but a
 * response from it can never become an image, a script, or a stylesheet.
 *
 * Neither is in `default-src`, `script-src` or `frame-src`. Cloudinary cannot
 * run code on this origin; it can only be read from and written to, in the two
 * specific ways below.
 */
const CLOUDINARY_DELIVERY = "https://res.cloudinary.com";
const CLOUDINARY_UPLOAD = "https://api.cloudinary.com";

function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // Next's dev overlay and React Refresh are compiled with eval.
    isDev ? "'unsafe-eval'" : "",
    // Ignored by browsers that honour strict-dynamic; a fallback for those
    // that don't understand it.
    "https:",
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // React writes inline style attributes for every animated transform, and
    // there is no nonce mechanism for attribute styles. This is the one
    // 'unsafe-inline' kept; it cannot be used to execute script.
    "style-src 'self' 'unsafe-inline'",
    // `blob:` is needed for the QR code and for three.js texture uploads;
    // Cloudinary is where every uploaded photo, and every video poster frame,
    // is now delivered from.
    `img-src 'self' data: blob: ${CLOUDINARY_DELIVERY}`,
    // Fonts are self-hosted — there is no third-party font CDN to trust.
    "font-src 'self'",
    // Video is uploaded from the browser straight to Cloudinary against a
    // signature this server issues — the bytes are too large to proxy through
    // a route handler. That upload is the only cross-origin request the app
    // makes, and this is the only host it may make it to.
    `connect-src 'self' ${CLOUDINARY_UPLOAD}` + (isDev ? " ws: wss:" : ""),
    `media-src 'self' blob: ${CLOUDINARY_DELIVERY}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const secureCookies = process.env.SECURE_COOKIES
    ? ["1", "true", "yes"].includes(process.env.SECURE_COOKIES.toLowerCase())
    : !isDev;

  const nonce = mintCsrfToken();
  const csp = buildCsp(nonce, isDev);
  const { pathname } = request.nextUrl;

  // Coarse gate: no session cookie at all means there is nothing to verify.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));
    if (!hasCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  const cookieName = csrfCookieName(secureCookies);
  const existingCsrf = request.cookies.get(cookieName)?.value;
  const csrfToken = isWellFormedCsrfToken(existingCsrf) ? existingCsrf : mintCsrfToken();
  const needsCsrfCookie = csrfToken !== existingCsrf;

  // Pass both values down on the request, so the layout can stamp the nonce
  // onto inline scripts and render the CSRF token — including on the very
  // first request, before the browser holds the cookie.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-csrf-token", csrfToken);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (needsCsrfCookie) {
    response.cookies.set(cookieName, csrfToken, {
      // Deliberately readable by script: the double-submit pattern needs the
      // page to read it. Its security comes from the same-origin policy and
      // the __Host- prefix, not from being hidden.
      httpOnly: false,
      secure: secureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  response.headers.set("content-security-policy", csp);
  // Belt and braces against MIME sniffing turning an upload into a script.
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-dns-prefetch-control", "off");
  response.headers.set("cross-origin-opener-policy", "same-origin");
  response.headers.set("cross-origin-resource-policy", "same-origin");
  response.headers.set("origin-agent-cluster", "?1");
  // Switch off device APIs this site has no use for, so a future dependency
  // can't quietly start asking for them.
  response.headers.set(
    "permissions-policy",
    [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", ")
  );

  if (!isDev) {
    response.headers.set(
      "strict-transport-security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // The admin area must never be cached by a shared proxy, or restored from
  // the browser's back-forward cache after sign-out.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    response.headers.set("cache-control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next's own static output and the icons, which are
     * immutable and gain nothing from a per-request nonce.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
