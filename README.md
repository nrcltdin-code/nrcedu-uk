# NRC Educational Consultant — website and CRM

Public website, admin panel and CRM for `nrcedu-uk.com`. Next.js 16 (App Router), PostgreSQL with Prisma 7, Better Auth, Tailwind 4.
The build plan and per-feature test checklists are in `PLAN.md`; the guide for NRC's team is `docs/client-guide.md`.

## Running locally

```bash
npm install            # also generates the Prisma client
cp .env.example .env   # then fill it in (see below)
npm run db:deploy      # apply migrations
npm run db:seed        # countries, plus the first admin from SEED_ADMIN_*
npm run dev            # http://localhost:3000
```

Optional sample content: `npm run db:seed:demo` (remove it with `npm run db:seed:demo -- --remove`).

`npm run build` reads the database for static pages, so it needs `DATABASE_URL` to be reachable.

## Settings (`.env`, and the same in Vercel)

| Setting | Needed for | Without it |
|---|---|---|
| `DATABASE_URL` | Everything | Site does not run |
| `AUTH_SECRET` | Sign-in | Site does not run |
| `APP_URL` | Links in emails, sitemap, social previews | Must be `https://www.nrcedu-uk.com` in production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in | Google button hidden |
| `STORAGE_*` | Image uploads and student documents (Cloudflare R2) | Uploads switched off |
| `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_STAFF_ALERTS` | All emails (Resend) | Emails only logged; password reset and email confirmation unavailable |
| `CRON_SECRET` | Morning reminder email and daily cleanup | Cron route answers 404 |
| `SEED_ADMIN_*` | First admin account (seed only) | No admin created |

## Deploying

Hosted on Vercel (app) and Railway (PostgreSQL). For every release that adds a migration (`prisma/migrations`):

1. `npm run db:deploy` against the production database **before** the new code goes live.
2. Push to `main`; Vercel builds and deploys.

The daily cron (`vercel.json`, 07:00 UTC) sends reminder digests and clears old rate-limit counts.

## Launch checklist

- [ ] All production settings above filled in Vercel; `APP_URL` is the live address
- [ ] `npm run db:deploy`, then `npm run db:seed` with the client's admin email
- [ ] Sample content removed: `npm run db:seed:demo -- --remove`
- [ ] Resend: domain verified, `EMAIL_FROM` on that domain; send a test password reset
- [ ] R2: public and private buckets, API token limited to them; upload a test image and document
- [ ] Google sign-in: production redirect URL `https://www.nrcedu-uk.com/api/auth/callback/google`
- [ ] DNS pointed to Vercel; HTTPS working on both `nrcedu-uk.com` and `www`
- [ ] Vercel → Cron Jobs: run the reminders job once by hand
- [ ] Google Search Console: add the site, submit `/sitemap.xml`
- [ ] Hand over: at least two admin accounts for NRC, `docs/client-guide.md`, billing for every service on NRC's card

## Code map

- `src/app/(site)` public pages · `src/app/dashboard` all signed-in screens · `src/app/api` uploads, documents, exports, cron, auth
- `src/lib/session.ts` who is signed in and what they may do (every action and route goes through it)
- `src/lib/dashboard-nav.ts` menu per role and permission · `src/lib/page-help.ts` "About this page" text (add one per new page)
- `src/lib/email.ts` emails · `src/lib/storage.ts` R2 · `src/lib/rate-limit.ts` form limits
