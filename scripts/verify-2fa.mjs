/** Verifies the TOTP enrolment → challenge → recovery-code path. */
import { authenticator } from "otplib";
try { process.loadEnvFile?.(".env"); } catch {}

// Safety check: ensure tests run against a local database only
const mongoUri = (process.env.MONGODB_URI || "").trim();
const isAtlasUri = mongoUri.startsWith("mongodb+srv://") || (Boolean(mongoUri) && !mongoUri.includes("localhost") && !mongoUri.includes("127.0.0.1"));
if (isAtlasUri) {
  console.error(`
================================================================================
  SAFETY CHECK FAILED: DESTRUCTIVE TEST REFUSED AGAINST REMOTE / ATLAS DATABASE
================================================================================
  MONGODB_URI is currently pointed to a remote/Atlas cluster:
  ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}

  This script resets 2FA tokens, recovery codes, and sessions.
  It MUST NOT run against production or shared Atlas databases.

  To run verification safely:
  1. Point MONGODB_URI to a local database in .env (e.g. MONGODB_URI="mongodb://localhost:27017")
  2. Or run: MONGODB_URI="mongodb://localhost:27017" npm run verify:2fa
================================================================================
`);
  process.exit(1);
}

const BASE = process.env.TEST_BASE_URL || process.env.SITE_URL || "http://localhost:3000";

const EMAIL = "admin@caldimengg.com";
const PASSWORD = process.argv[2];

let pass = 0, fail = 0;
const check = (n, c, d="") => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n} ${d}`); } };

class Jar {
  constructor(){ this.c = new Map(); }
  absorb(r){ for (const line of (r.headers.getSetCookie?.() ?? [])) { const [p] = line.split(";"); const i = p.indexOf("="); const k = p.slice(0,i).trim(); const v = p.slice(i+1).trim(); if (v==="") this.c.delete(k); else this.c.set(k,v);} }
  h(){ return [...this.c].map(([k,v])=>`${k}=${v}`).join("; "); }
  get(n){ return this.c.get(n); }
}
async function req(jar, path, opts={}) {
  const headers = new Headers(opts.headers ?? {});
  const cookie = jar.h(); if (cookie) headers.set("cookie", cookie);
  if (opts.method && opts.method !== "GET") { headers.set("origin", BASE); headers.set("sec-fetch-site","same-origin"); }
  const r = await fetch(`${BASE}${path}`, { ...opts, headers, redirect: "manual" });
  jar.absorb(r); return r;
}

const jar = new Jar();
await req(jar, "/");
const csrf = () => jar.get("caldim_csrf");

console.log("\n── Two-factor enrolment ────────────────────────────────────");
const login = await req(jar, "/api/auth/login", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": csrf() },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
check("signed in", login.status === 200, String(login.status));

const setup = await req(jar, "/api/auth/totp/enrol");
const setupBody = await setup.json();
check("enrolment secret issued", setup.status === 200 && Boolean(setupBody.manualKey));
check("QR code returned as a data URL", (setupBody.qrDataUrl ?? "").startsWith("data:image/png"));

const secret = setupBody.manualKey;

const wrongCode = await req(jar, "/api/auth/totp/enrol", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": csrf() },
  body: JSON.stringify({ code: "000000" }),
});
check("wrong enrolment code rejected", wrongCode.status === 400, String(wrongCode.status));

const confirm = await req(jar, "/api/auth/totp/enrol", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": csrf() },
  body: JSON.stringify({ code: authenticator.generate(secret) }),
});
const confirmBody = await confirm.json();
check("2FA enrolled with a live code", confirm.status === 200 && confirmBody.ok);
check("recovery codes returned once", Array.isArray(confirmBody.recoveryCodes) && confirmBody.recoveryCodes.length === 10);
const recovery = confirmBody.recoveryCodes ?? [];

console.log("\n── Two-factor challenge ────────────────────────────────────");
await req(jar, "/api/auth/logout", { method: "POST", headers: { "x-caldim-csrf": csrf() } });

const jar2 = new Jar();
await req(jar2, "/");
const login2 = await req(jar2, "/api/auth/login", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar2.get("caldim_csrf") },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const login2Body = await login2.json();
check("password step now routes to the 2FA challenge", login2Body.next === "/admin/verify", login2Body.next);
check("login response flags that a second factor is required", login2Body.requiresTotp === true);

const halfAuth = await req(jar2, "/api/admin/leaders");
check("half-authenticated session cannot reach the admin API", halfAuth.status === 401, String(halfAuth.status));

const dash = await req(jar2, "/admin");
check("half-authenticated session redirected away from the dashboard",
  dash.status === 307 && (dash.headers.get("location") ?? "").includes("/admin/verify"),
  `${dash.status} ${dash.headers.get("location")}`);

const badTotp = await req(jar2, "/api/auth/totp", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar2.get("caldim_csrf") },
  body: JSON.stringify({ code: "000000", mode: "totp" }),
});
check("wrong TOTP code rejected", badTotp.status === 401, String(badTotp.status));

const goodTotp = await req(jar2, "/api/auth/totp", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar2.get("caldim_csrf") },
  body: JSON.stringify({ code: authenticator.generate(secret), mode: "totp" }),
});
check("correct TOTP code completes sign-in", goodTotp.status === 200, String(goodTotp.status));

const nowAllowed = await req(jar2, "/api/admin/leaders");
check("fully authenticated session clears 2FA requirement (status 200 or 403 pwd-change pending)",
  nowAllowed.status === 200 || nowAllowed.status === 403, String(nowAllowed.status));

console.log("\n── Recovery codes ──────────────────────────────────────────");
await req(jar2, "/api/auth/logout", { method: "POST", headers: { "x-caldim-csrf": jar2.get("caldim_csrf") } });

const jar3 = new Jar();
await req(jar3, "/");
await req(jar3, "/api/auth/login", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar3.get("caldim_csrf") },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const useRecovery = await req(jar3, "/api/auth/totp", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar3.get("caldim_csrf") },
  body: JSON.stringify({ code: recovery[0], mode: "recovery" }),
});
check("recovery code accepted", useRecovery.status === 200, String(useRecovery.status));

// The same code again, on a brand-new sign-in attempt, must now fail.
await req(jar3, "/api/auth/logout", { method: "POST", headers: { "x-caldim-csrf": jar3.get("caldim_csrf") } });
const jar4 = new Jar();
await req(jar4, "/");
await req(jar4, "/api/auth/login", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar4.get("caldim_csrf") },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const reuse = await req(jar4, "/api/auth/totp", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar4.get("caldim_csrf") },
  body: JSON.stringify({ code: recovery[0], mode: "recovery" }),
});
check("a used recovery code cannot be replayed", reuse.status === 401, String(reuse.status));

const second = await req(jar4, "/api/auth/totp", {
  method: "POST", headers: { "content-type":"application/json", "x-caldim-csrf": jar4.get("caldim_csrf") },
  body: JSON.stringify({ code: recovery[1], mode: "recovery" }),
});
check("a different, unused recovery code still works", second.status === 200, String(second.status));

console.log("\n── Turning 2FA off ─────────────────────────────────────────");
const wrongPw = await req(jar4, "/api/auth/totp/enrol", {
  method: "DELETE", headers: { "content-type":"application/json", "x-caldim-csrf": jar4.get("caldim_csrf") },
  body: JSON.stringify({ password: "not-the-password" }),
});
check("disabling 2FA requires the correct password", wrongPw.status === 401, String(wrongPw.status));

const off = await req(jar4, "/api/auth/totp/enrol", {
  method: "DELETE", headers: { "content-type":"application/json", "x-caldim-csrf": jar4.get("caldim_csrf") },
  body: JSON.stringify({ password: PASSWORD }),
});
check("2FA disabled with the correct password", off.status === 200, String(off.status));

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
