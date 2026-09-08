# Caldim Engineering

The Caldim Engineering website — a Next.js 14 App Router site with a
self-contained admin area for editing its content.

---

## Quick start

Requires **Node 22 LTS or newer** — check with `node -v`, and get it from
<https://nodejs.org> if you need it.

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Now fill in `.env`. Two services are needed before the app will start:

- **Supabase** — create a project, then copy both connection strings from
  *Project Settings → Database → Connection string → URI*. See
  [Connection strings](#connection-strings) for which goes where.
- **Cloudinary** — create an account, then copy the cloud name, API key and API
  secret from *Settings → API Keys*.

Then:

```bash
npm run db:migrate        # create the tables in Supabase
npm run db:seed           # create the owner account, prints a password ONCE
npm run doctor            # confirms everything is wired up
npm run dev
```

`npm run db:generate` is only needed after you edit `lib/db/schema.ts` — the
migrations for the current schema are already checked in.

If anything goes wrong, **run `npm run doctor` first** — it reports what was
actually found (Node version, secrets, migrations, Supabase connection,
account) rather than making you read a stack trace.

Open <http://localhost:3000> for the site and
<http://localhost:3000/admin/login> for the admin area, using the email and
password the seed step printed. You will be asked to change that password
immediately, and prompted to turn on two-factor authentication.

### The three secrets

`SESSION_SECRET`, `APP_ENCRYPTION_KEY` and `IP_HASH_SALT` are required in
production — the app refuses to start without them. Generate each separately:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

In development, ephemeral values are generated at startup if they are missing,
so `npm run dev` works from a fresh clone. They rotate on every restart, which
just means local sessions drop.

---

## What's here

```
app/
  page.tsx                 the public homepage (a Server Component)
  admin/                   the content administration area
  api/                     auth, admin, media and contact route handlers
components/
  sections/                one file per homepage section
  three/                   the WebGL connection viewer and its fallbacks
  admin/                   admin shell, forms and editors
  ui/                      SectionHeading, Reveal — shared primitives
lib/
  db/                      Drizzle schema and the Postgres client
  media/                   the Cloudinary client — the only holder of the secret
  content/                 shipped defaults + the DB-over-defaults resolver
  security/                auth, sessions, CSRF, rate limiting, uploads, audit
drizzle/                   generated SQL migrations (checked in)
scripts/                   migrate, seed and account-recovery CLI tools
```

### Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind, with a CSS-variable theme (dark and light) |
| Database | Supabase Postgres via Drizzle ORM + postgres-js |
| Media | Cloudinary — photos, video, and CDN delivery |
| 3D | three.js / react-three-fiber / drei |
| Motion | GSAP + ScrollTrigger, Lenis, framer-motion |
| Images | sharp (re-encoding on upload), then Cloudinary `f_auto,q_auto` |
| Auth | argon2id, TOTP, server-side sessions |

Two services need provisioning: a **Supabase** project for the database and a
**Cloudinary** account for media. Both have free tiers that comfortably cover a
site of this size. Fonts are still served from the app itself.

### Connection strings

Supabase gives you two, and the difference matters:

| | Port | Used by | Why |
|---|---|---|---|
| `DATABASE_URL` | 6543 | the app | Pooled (Supavisor). Next opens many short-lived server contexts; a direct connection per context exhausts Postgres' connection slots. |
| `DIRECT_DATABASE_URL` | 5432 | `npm run db:migrate` | DDL and the migrator's advisory lock are per-connection state. The pooler hands connections between clients, so a migration run through it can deadlock or apply half a change set. |

The app also sets `prepare: false` on its connection. Supavisor runs in
transaction mode, where named prepared statements leak between clients and fail
with *"prepared statement already exists"*. Queries are still parameterised —
only the server-side plan cache is given up.

### Migrations

Migrations are a deploy step, not something the app does at startup:

```bash
npm run db:generate    # after editing lib/db/schema.ts
npm run db:migrate     # apply to Supabase, over the direct connection
```

On one SQLite file, migrating on boot was free and could not race. Against a
hosted Postgres with several server instances, boot-time migration means every
instance racing the same DDL lock on every cold start.

---

## The admin area

Sign in at `/admin`. What you can do there:

| Screen | What it does |
|---|---|
| **Overview** | Counts, recent activity, and any security warnings that need attention |
| **Leadership** | Add, edit, reorder and remove the people in "Meet Our Leadership", including photo uploads |
| **Media** | Upload photos and video, edit titles and alt text, delete. Photos are re-encoded server-side; video uploads straight to Cloudinary with a progress bar |
| **Gallery** | Place photos and video into the slots the public site reads from — caption, detail line, ordering, and a live/draft toggle |
| **Site content** | Edit the homepage copy — hero, services, projects, statistics, events, testimonials, certifications, careers, offices, contacts |
| **Media** | Every uploaded image, with its dimensions and size |
| **Enquiries** | Every RFQ submitted through the contact form |
| **Activity** | The full audit log |
| **Security** | Two-factor setup, password change, and the list of devices signed in as you |

### How content resolution works

The site ships with its copy in `lib/content/defaults.ts`. The admin area writes
*overrides* into the database; the public page layers those over the defaults at
render time.

That has three useful consequences:

- **An empty database renders the complete site**, not a scaffold of blank
  sections. You can deploy before anyone has signed in.
- **"Revert" is a delete.** Removing an override restores the shipped text.
- **A corrupt or outdated row degrades one section, not the page.** Stored
  content is re-validated on read; anything that fails falls back to its
  default and logs a warning.

Saving publishes immediately — `revalidatePath("/")` runs on every write, so
there is no deploy step between editing and seeing it live.

### Leadership placeholders

Until you add a real leader, the section shows four clearly-marked placeholder
cards (`[Leader Name]`, "PHOTO PENDING"). Adding one real entry replaces all of
them. That way the section is never empty, and never accidentally ships with
fake names that look real.

---

## Photos

Upload leadership portraits from the leadership editor or the media library.

- **Formats**: JPEG, PNG, WebP, AVIF. Up to 5 MB.
- **Crop**: portrait (4:5) works best; the card crops to that ratio.
- **What happens on upload**: the image is decoded, resized to fit within
  2400 px, and re-encoded to WebP. That strips EXIF metadata — including the
  GPS coordinates phones embed in photographs — and removes anything hidden
  alongside the image data.
- **Where it goes**: `data/uploads/`, outside the public folder, served through
  an access-controlled route rather than as a static file.

---

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | Preflight check — run this first when something won't start |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate SQL migrations after a schema change |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:seed` | Create the owner account (first run only) |
| `npm run admin:reset -- <email> [--clear-2fa]` | Reset a password from the console |

Migrations are applied automatically at startup, so the schema can never lag
behind the code that expects it.

---

## Deployment

This app keeps no state on disk: the database is Supabase and the media is
Cloudinary, so **no persistent volume is required** and it deploys cleanly to
serverless platforms. It runs well on Vercel, a VPS, Railway,
Render, Fly.io, or your own server.

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

Behind a reverse proxy, make sure that:

- **TLS terminates in front of the app** and `SECURE_COOKIES` stays true;
- the proxy **overwrites** `X-Forwarded-For` rather than appending to it —
  otherwise a client can spoof it and evade rate limiting;
- `SITE_URL` matches the real public origin, since it is used for the CSRF
  origin check.

### Backups

Supabase takes automatic daily backups on every paid plan; on the free tier you
should take your own:

```bash
pg_dump "$DIRECT_DATABASE_URL" --no-owner --format=custom -f backup/caldim-$(date +%F).dump
```

Media is backed up separately, by Cloudinary. The two are **not** consistent
with one another: restoring an old database next to current media leaves rows
pointing at assets that may since have been deleted. If you restore, check the
media library for broken entries afterwards.

---

## Verification

The security controls are covered by a suite that runs against a live server
rather than mocks — 78 assertions across CSRF rejection, session revocation,
account-enumeration resistance, upload magic-byte sniffing, path traversal,
rate limiting, content-key allowlisting, and the full two-factor
enrolment/challenge/recovery cycle.

To run it, start a server (e.g. production build on port 3100 or dev server) and point the suite at it:

```bash
npm run build
SITE_URL=http://localhost:3100 SECURE_COOKIES=false npx next start -p 3100 &
npm run verify "<the seeded password>"
npm run verify:2fa "<the seeded password>"
npm run verify:lockout
```

> **Target URL Override**: By default, the verification scripts target `http://localhost:3100`. You can override this target URL at any time via `TEST_BASE_URL` or `SITE_URL` (e.g., `TEST_BASE_URL=http://localhost:3000 npm run verify`).

Both scripts print a pass/fail line per assertion and exit non-zero on any
failure.

---

## Notes for whoever works on this next

**Sections take content as props.** They don't import `lib/data/content.ts`
directly. That is what lets the admin area change the page without a redeploy,
and it keeps each section renderable in isolation.

**Colours come from tokens, never hex literals.** Every colour — including the
ones inside inline SVG — reads from a CSS variable defined in `globals.css`.
Hard-coding a hex breaks the light theme, usually invisibly: a dark label box
on a pale card, or mid-grey text at 1.6:1 contrast.

**The 3D scene is code-split and gated.** `useWebGL` checks for reduced motion,
a WebGL context, and pathological hardware before mounting anything, and
`useNearViewport` delays the import until the element is close to the fold.
Every 3D element has a static fallback that carries the same information.

**Anchors go through Lenis.** `html { scroll-behavior }` is deliberately `auto`;
a native smooth scroll fights the interpolation loop. `SmoothScroll` intercepts
in-page anchor clicks, scrolls with an offset for the fixed header, and moves
focus so the jump works for keyboard and screen-reader users too.

**Every mutating request needs the CSRF header.** Use `createApiClient` from
`components/CsrfProvider` rather than calling `fetch` directly; anything that
skips it gets a 403, which is the intended failure mode — it makes the omission
loud rather than silent.

**Security details live in [SECURITY.md](./SECURITY.md)**, including what is
*not* covered and still needs a decision from you.
# caldim-website
