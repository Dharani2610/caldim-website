/**
 * End-to-end verification against the running server.
 * Exercises the real HTTP surface, not mocks.
 */
const BASE = process.env.TEST_BASE_URL || process.env.SITE_URL || "http://localhost:3100";
const EMAIL = "admin@caldimengg.com";
const PASSWORD = process.argv[2];

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** A tiny cookie jar, so we can drive a real session across requests. */
class Jar {
  constructor() { this.cookies = new Map(); }
  absorb(response) {
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const line of raw) {
      const [pair] = line.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  get(name) { return this.cookies.get(name); }
}

async function req(jar, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const cookie = jar.header();
  if (cookie) headers.set("cookie", cookie);
  // Emulate a same-origin fetch from the page.
  if (!headers.has("origin") && options.method && options.method !== "GET") {
    headers.set("origin", BASE);
    headers.set("sec-fetch-site", "same-origin");
  }
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  jar.absorb(response);
  return response;
}

async function main() {
  console.log("\n── Public page ─────────────────────────────────────────────");
  const jar = new Jar();
  const home = await req(jar, "/");
  const html = await home.text();

  check("homepage returns 200", home.status === 200, `got ${home.status}`);
  check("leadership section rendered", html.includes('id="leadership"'));
  check("leadership heading present", html.includes("Meet Our Leadership") || html.includes("MEET OUR LEADERSHIP"));
  check("placeholder leaders shown when DB empty", html.includes("PHOTO PENDING"));
  check("hero copy comes from content layer", html.includes("Steel, detailed."));
  check("nav includes the new Leadership link", html.includes("#leadership"));
  check("fonts are self-hosted (no Google Fonts)", !html.includes("fonts.googleapis.com") && !html.includes("fonts.gstatic.com"));

  console.log("\n── Security headers ────────────────────────────────────────");
  const csp = home.headers.get("content-security-policy") ?? "";
  check("CSP present", csp.length > 0);
  check("CSP uses a nonce, not unsafe-inline for scripts", csp.includes("nonce-") && !/script-src[^;]*'unsafe-inline'/.test(csp));
  check("CSP sets object-src none", csp.includes("object-src 'none'"));
  check("CSP sets frame-ancestors none", csp.includes("frame-ancestors 'none'"));
  check("CSP sets base-uri none", csp.includes("base-uri 'none'"));
  check("X-Content-Type-Options nosniff", home.headers.get("x-content-type-options") === "nosniff");
  check("X-Frame-Options DENY", home.headers.get("x-frame-options") === "DENY");
  check("Referrer-Policy set", (home.headers.get("referrer-policy") ?? "").includes("strict-origin"));
  check("Permissions-Policy set", (home.headers.get("permissions-policy") ?? "").includes("geolocation=()"));
  check("COOP same-origin", home.headers.get("cross-origin-opener-policy") === "same-origin");
  check("X-Powered-By suppressed", !home.headers.has("x-powered-by"));
  check("CSRF cookie issued", Boolean(jar.get("caldim_csrf")));

  console.log("\n── Admin access control ────────────────────────────────────");
  const anon = new Jar();
  const adminRedirect = await req(anon, "/admin");
  check("/admin redirects when signed out", adminRedirect.status === 307 || adminRedirect.status === 308,
    `got ${adminRedirect.status}`);
  check("redirect target is the login page", (adminRedirect.headers.get("location") ?? "").includes("/admin/login"));

  const apiAnon = await req(anon, "/api/admin/leaders");
  check("admin API refuses anonymous GET", apiAnon.status === 401, `got ${apiAnon.status}`);

  const writeAnon = await req(anon, "/api/admin/content", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "hero", value: {} }),
  });
  check("admin API refuses anonymous write", writeAnon.status === 401 || writeAnon.status === 403,
    `got ${writeAnon.status}`);

  console.log("\n── CSRF ────────────────────────────────────────────────────");
  // Cross-origin POST: should be rejected on the Origin check alone.
  const crossOrigin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      "sec-fetch-site": "cross-site",
      cookie: jar.header(),
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    redirect: "manual",
  });
  check("cross-origin login POST rejected", crossOrigin.status === 403, `got ${crossOrigin.status}`);

  // Same-origin POST with no CSRF header: rejected on the double-submit check.
  const noToken = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { origin: BASE, "sec-fetch-site": "same-origin", cookie: jar.header() },
    body: new FormData(),
    redirect: "manual",
  });
  check("same-origin POST without CSRF token rejected", noToken.status === 403, `got ${noToken.status}`);

  console.log("\n── Login ───────────────────────────────────────────────────");
  const token = jar.get("caldim_csrf");

  const wrongPassword = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": token },
    body: JSON.stringify({ email: EMAIL, password: "definitely-not-the-password" }),
  });
  const wrongBody = await wrongPassword.json();
  check("wrong password rejected with 401", wrongPassword.status === 401, `got ${wrongPassword.status}`);

  const unknownUser = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": token },
    body: JSON.stringify({ email: "nobody@example.com", password: "definitely-not-the-password" }),
  });
  const unknownBody = await unknownUser.json();
  check("unknown account gives an identical message (no enumeration)",
    unknownBody.error === wrongBody.error, `"${unknownBody.error}" vs "${wrongBody.error}"`);

  const honeypot = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": token },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, website: "spam" }),
  });
  check("honeypot submission does not create a session",
    honeypot.status === 200 && !jar.get("caldim_session"));

  const login = await req(jar, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": token },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await login.json();
  check("correct password signs in", login.status === 200 && loginBody.ok === true,
    `${login.status} ${JSON.stringify(loginBody)}`);
  check("session cookie is httpOnly", (login.headers.getSetCookie?.() ?? []).some((c) => c.includes("caldim_session") && /httponly/i.test(c)));
  check("session cookie is SameSite=Lax", (login.headers.getSetCookie?.() ?? []).some((c) => c.includes("caldim_session") && /samesite=lax/i.test(c)));
  check("seeded account is forced to change its password", loginBody.next === "/admin/security/password",
    `next was ${loginBody.next}`);

  console.log("\n── Authenticated behaviour ─────────────────────────────────");
  const leaders = await req(jar, "/api/admin/leaders");
  check("admin API allows the signed-in user", leaders.status === 200, `got ${leaders.status}`);

  // The password screen is reachable, but the dashboard should push back to it.
  const dashboard = await req(jar, "/admin");
  check("dashboard redirects while a password change is pending",
    dashboard.status === 307 && (dashboard.headers.get("location") ?? "").includes("/admin/security/password"),
    `${dashboard.status} → ${dashboard.headers.get("location")}`);

  const NEW_PASSWORD = "Cantilever-Purlin-Haunch-77120";
  const changed = await req(jar, "/api/auth/password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": jar.get("caldim_csrf") },
    body: JSON.stringify({
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    }),
  });
  const changedBody = await changed.json();
  check("password change succeeds", changed.status === 200 && changedBody.ok === true,
    JSON.stringify(changedBody));

  const weak = await req(jar, "/api/auth/password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": jar.get("caldim_csrf") },
    body: JSON.stringify({ currentPassword: NEW_PASSWORD, newPassword: "short", confirmPassword: "short" }),
  });
  check("weak password rejected by policy", weak.status === 400, `got ${weak.status}`);

  const dashboardNow = await req(jar, "/admin");
  check("dashboard reachable after the password change", dashboardNow.status === 200,
    `got ${dashboardNow.status}`);

  console.log("\n── Content CMS ─────────────────────────────────────────────");
  const csrf = jar.get("caldim_csrf");

  const badKey = await req(jar, "/api/admin/content", {
    method: "PUT",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({ key: "../../etc/passwd", value: {} }),
  });
  check("unknown content key rejected", badKey.status === 400, `got ${badKey.status}`);

  const badShape = await req(jar, "/api/admin/content", {
    method: "PUT",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({ key: "hero", value: { eyebrow: "" } }),
  });
  check("malformed content rejected by schema", badShape.status === 400, `got ${badShape.status}`);

  const goodContent = await req(jar, "/api/admin/content", {
    method: "PUT",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({
      key: "hero",
      value: {
        eyebrow: "EDITED VIA ADMIN",
        headingLine1: "Steel, verified.",
        headingLine2: "Precisely.",
        subheading: "This copy was written through the admin API during the verification run.",
        primaryCta: "Request Quote",
        secondaryCta: "View Capabilities",
      },
    }),
  });
  check("valid content saves", goodContent.status === 200, `got ${goodContent.status}`);

  const editedHome = await (await req(new Jar(), "/")).text();
  check("edited copy appears on the public page", editedHome.includes("Steel, verified."));
  check("edited eyebrow appears on the public page", editedHome.includes("EDITED VIA ADMIN"));

  const reverted = await req(jar, "/api/admin/content?key=hero", {
    method: "DELETE",
    headers: { "x-caldim-csrf": csrf },
  });
  check("content reverts to the shipped default", reverted.status === 200, `got ${reverted.status}`);

  const revertedHome = await (await req(new Jar(), "/")).text();
  check("public page shows the default again after revert",
    revertedHome.includes("Steel, detailed.") && !revertedHome.includes("Steel, verified."));

  console.log("\n── Leadership CRUD ─────────────────────────────────────────");
  const created = await req(jar, "/api/admin/leaders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({
      name: "Verification Tester",
      title: "Principal, Connections Design",
      credentials: "PE, SE",
      bio: "Created by the automated verification run.",
      location: "Chennai, India",
      email: "test@caldimengg.com",
      linkedinUrl: "https://www.linkedin.com/in/example",
      published: true,
    }),
  });
  const createdBody = await created.json();
  check("leader created", created.status === 201 && createdBody.ok, JSON.stringify(createdBody).slice(0, 200));
  const leaderId = createdBody.leader?.id;

  const xssAttempt = await req(jar, "/api/admin/leaders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-caldim-csrf": csrf },
    body: JSON.stringify({
      name: "Injection Probe",
      title: "Tester",
      linkedinUrl: "javascript:alert(document.cookie)",
    }),
  });
  check("javascript: URL rejected on the LinkedIn field", xssAttempt.status === 400,
    `got ${xssAttempt.status}`);

  const publicWithLeader = await (await req(new Jar(), "/")).text();
  check("real leader replaces the placeholders", publicWithLeader.includes("Verification Tester"));
  check("placeholders gone once a real leader exists", !publicWithLeader.includes("[Leader Name]"));

  if (leaderId) {
    const removed = await req(jar, `/api/admin/leaders/${leaderId}`, {
      method: "DELETE",
      headers: { "x-caldim-csrf": csrf },
    });
    check("leader deleted", removed.status === 200, `got ${removed.status}`);
  }

  console.log("\n── Uploads ─────────────────────────────────────────────────");
  // A file that claims to be a PNG but is actually HTML with a script tag.
  const polyglot = new FormData();
  polyglot.set(
    "file",
    new File(["<html><script>alert(1)</script></html>"], "portrait.png", { type: "image/png" })
  );
  const polyglotUpload = await req(jar, "/api/admin/media", {
    method: "POST",
    headers: { "x-caldim-csrf": csrf },
    body: polyglot,
  });
  check("disguised HTML rejected by magic-byte check", polyglotUpload.status === 400,
    `got ${polyglotUpload.status}`);

  // A real PNG, produced here so the test doesn't depend on a fixture.
  const { default: sharp } = await import("sharp");
  const realPng = await sharp({
    create: { width: 640, height: 800, channels: 3, background: { r: 40, g: 60, b: 80 } },
  }).png().toBuffer();

  const goodUpload = new FormData();
  goodUpload.set("file", new File([realPng], "portrait.png", { type: "image/png" }));
  const uploaded = await req(jar, "/api/admin/media", {
    method: "POST",
    headers: { "x-caldim-csrf": csrf },
    body: goodUpload,
  });
  const uploadBody = await uploaded.json();
  check("real PNG accepted", uploaded.status === 201 && uploadBody.ok,
    JSON.stringify(uploadBody).slice(0, 200));

  if (uploadBody.url) {
    const served = await req(new Jar(), uploadBody.url);
    check("uploaded image is served", served.status === 200, `got ${served.status}`);
    check("image re-encoded to WebP (EXIF and payloads stripped)",
      served.headers.get("content-type") === "image/webp",
      served.headers.get("content-type") ?? "none");
    check("served with nosniff", served.headers.get("x-content-type-options") === "nosniff");
  }

  const traversal = await req(new Jar(), "/api/media/..%2F..%2F..%2Fetc%2Fpasswd");
  check("path traversal on the media route rejected", traversal.status === 404,
    `got ${traversal.status}`);

  console.log("\n── Public contact form ─────────────────────────────────────");
  const contactJar = new Jar();
  await req(contactJar, "/");
  const contactToken = contactJar.get("caldim_csrf");

  const form = new FormData();
  form.set("name", "Jordan Reyes");
  form.set("company", "Reyes Fabrication");
  form.set("email", "jordan@fab-co.example");
  form.set("projectType", "Structural Steel Detailing");
  form.set("message", "Verification run.");
  form.set("elapsedMs", "9000");

  const contact = await req(contactJar, "/api/contact", {
    method: "POST",
    headers: { "x-caldim-csrf": contactToken },
    body: form,
  });
  check("valid RFQ accepted", contact.status === 200, `got ${contact.status}`);

  const badForm = new FormData();
  badForm.set("name", "x");
  badForm.set("company", "y");
  badForm.set("email", "not-an-email");
  badForm.set("elapsedMs", "9000");
  const badContact = await req(contactJar, "/api/contact", {
    method: "POST",
    headers: { "x-caldim-csrf": contactToken },
    body: badForm,
  });
  check("invalid RFQ rejected by schema", badContact.status === 400, `got ${badContact.status}`);

  console.log("\n── Rate limiting ───────────────────────────────────────────");
  const attackJar = new Jar();
  await req(attackJar, "/");
  const attackToken = attackJar.get("caldim_csrf");
  let sawLimit = false;
  for (let i = 0; i < 14; i += 1) {
    const attempt = await req(attackJar, "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-caldim-csrf": attackToken },
      body: JSON.stringify({ email: `probe${i}@example.com`, password: "wrong-password-here" }),
    });
    if (attempt.status === 429) { sawLimit = true; break; }
  }
  check("repeated failed logins get rate-limited", sawLimit);

  console.log("\n── Sign out ────────────────────────────────────────────────");
  const loggedOut = await req(jar, "/api/auth/logout", {
    method: "POST",
    headers: { "x-caldim-csrf": jar.get("caldim_csrf") },
  });
  check("logout succeeds", loggedOut.status === 200, `got ${loggedOut.status}`);

  const afterLogout = await req(jar, "/api/admin/leaders");
  check("admin API refuses the revoked session", afterLogout.status === 401,
    `got ${afterLogout.status}`);

  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`  ${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log("\n  Failures:");
    for (const failure of failures) console.log(`   • ${failure}`);
  }
  console.log("");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\nVerification crashed:", error);
  process.exit(2);
});
