# Super Cleaner — JK Industries

A responsive, animated e-commerce **MVP** for the Super Cleaner cleaning & automotive care brand, manufactured by JK Industries.

Retailers, wholesalers and distributors can browse a unified catalogue, build a cart across pack-size variants and send **order requests** or **WhatsApp enquiries**. Everything is managed from a password-protected admin dashboard.

There are **no online payments** — orders are requests that JK Industries confirms (wholesale pricing, taxes and shipping are agreed separately), and there are **no product categories** by design.

---

## Table of contents

- [What's included](#whats-included)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Admin dashboard](#admin-dashboard)
- [Environment variables](#environment-variables)
- [Switching from SQLite to PostgreSQL](#switching-from-sqlite-to-postgresql)
- [How ordering works](#how-ordering-works)
- [Order status workflow \& notifications](#order-status-workflow--notifications)
- [Project structure](#project-structure)
- [Security notes](#security-notes)
- [Caching & revalidation](#caching--revalidation)
- [Known MVP limitations](#known-mvp-limitations)
- [Testing](#testing)
- [Deployment](#deployment)
- [Legal / content placeholders](#legal--content-placeholders)
- [Out of scope](#out-of-scope)

---

## What's included

**Public site**

- Animated navbar (transparent over the homepage hero → blurred/solid on scroll) with Home, All Products, About Us, Contact, a persistent cart icon and a prominent WhatsApp button.
- Cinematic hero, featured products, brand intro, configurable “Why Choose Super Cleaner” benefits, a wholesale CTA band, and a footer with policy links.
- Single unified catalogue: search by **name or SKU**, sorting, availability / pack-size filters, loading skeletons, empty and error states.
- Product detail pages: gallery, SKU, description, how-to-use, pack-size selector, quantity stepper, MRP (and optional wholesale price), availability badge, add-to-cart and a prefilled WhatsApp enquiry.
- Cart & order-request form: multiple products and pack-size variants, quantity edits, removal, live subtotal, MOQ validation, empty state, an animated slide-in cart drawer, `localStorage` persistence, and **server-side re-validation** of every price and quantity.
- Animated confirmation page with a unique order reference.
- Privacy, Terms and Shipping & Returns pages, plus a contact page with an enquiry form (`contact`, `product`, `dealer`, `wholesale`).
- WhatsApp click-to-chat links (`wa.me`) prefilled with product, SKU, pack size, quantity or the whole cart.

**Admin dashboard** (`/admin`)

- Product create / edit / **deactivate** / permanent delete (blocked when a product is referenced by order history), image upload, pack sizes, MRP, optional wholesale price, MOQ, availability, featured flag and a per-product price-visibility toggle.
- Order list with search (reference / customer / mobile) and status filter, order detail with line items and prices, one-click **Accept order → Processing → Shipped → Delivered** workflow actions, **staff-only internal notes**, a **status timeline** showing when the customer was notified, and a one-click prefilled WhatsApp message to the customer's number.
- Enquiry list with search + status filters, WhatsApp shortcuts and status management (`new` → `contacted` → `resolved`).
- Settings: brand, manufacturer, tagline, hero copy, contact details, WhatsApp number, GSTIN, address, price & stock visibility, “why choose” benefits, social links.
- Change-password form.

**Infrastructure**

- Server-side validation with Zod on every write endpoint.
- Rate limiting, honeypot spam protection, idempotent order creation (duplicate-submission safe).
- Optimistic images, lazy loading, semantic HTML, keyboard navigation, labelled forms, `prefers-reduced-motion` support, no layout shift.
- `sitemap.xml`, `robots.txt`, web manifest, per-page titles/meta/OpenGraph, clean product URLs.

---

## Tech stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, TypeScript, `cacheComponents`)    |
| Styling    | Tailwind CSS v4                                            |
| Animation  | Motion for React (`motion/react`)                          |
| Database   | Prisma 6 — **SQLite locally**, PostgreSQL in production    |
| Auth       | bcryptjs password hashing + `jose` HS256 session cookie    |
| Validation | Zod v4                                                     |
| Icons      | lucide-react                                               |

> **Note:** Next.js 16 has several breaking changes (Promise-based `params`/`searchParams`, `proxy.ts` instead of `middleware.ts`, 2-argument `revalidateTag`). The bundled docs in `node_modules/next/dist/docs/` are the source of truth for this version.

---

## Quick start

Requirements: **Node.js 20.9+** and npm.

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env
#    - set DATABASE_URL to your PostgreSQL URL
#      (the project is pre-configured for the live Prisma Postgres DB;
#       for a zero-setup SQLite sandbox, set provider = "sqlite" in
#       prisma/schema.prisma and DATABASE_URL="file:./dev.db")
#    - generate AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#    - optionally set ADMIN_EMAIL / ADMIN_PASSWORD (see below)

# 3. Create the database and seed it
npm run db:setup

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site and [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

> On Windows PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`.

### Available scripts

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the dev server                          |
| `npm run build`   | `prisma generate` + production build          |
| `npm run start`   | Serve the production build                    |
| `npm run lint`    | ESLint                                        |
| `npm run db:setup`| Push the schema **and** seed                  |
| `npm run db:push` | Push the Prisma schema (no seed)              |
| `npm run db:seed` | Seed admin user, settings and products        |
| `npm run db:studio` | Open Prisma Studio                          |

`db:setup` / `db:seed` are idempotent — re-running updates existing settings and products and never deletes anything.

---

## Admin dashboard

**Default credentials**

```
URL     http://localhost:3000/admin
Email   admin@supercleaner.example
Password changeme123
```

**Change them before going live.** Either:

1. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` and run `npm run db:seed` again, **or**
2. Sign in and use **Settings → Change password**.

Sessions last **8 hours** and are stored in an httpOnly cookie (`sc_admin_session`). Changing `AUTH_SECRET` invalidates every session.

Admin navigation: **Overview · Products · Orders · Enquiries · Settings**.

> **Products are only ever created or modified from this dashboard.** The public site has no write path to the catalogue — every `/api/admin/*` route requires a verified admin session.

---

## Environment variables

Copy `.env.example` → `.env`.

| Variable                | Required | Purpose |
| ----------------------- | -------- | ------- |
| `DATABASE_URL`          | ✅ | Prisma connection string (`file:./dev.db` for SQLite, a `postgresql://` URL for Postgres). |
| `AUTH_SECRET`           | ✅ | Signs admin session cookies. Must be ≥ 16 chars — use a 32-byte random hex string. |
| `NEXT_PUBLIC_SITE_URL`  | ✅ | Public origin used for `sitemap.xml`, `robots.txt`, `host` and canonical/OG URLs, e.g. `https://example.com`. |
| `ADMIN_EMAIL`           | — | Admin email used by the seeder (default `admin@supercleaner.example`). |
| `ADMIN_PASSWORD`        | — | Admin password used by the seeder (default `changeme123`). |
| `EMAIL_API_KEY`         | — | Enables order-notification emails. Unset = emails are silently skipped. |
| `EMAIL_FROM`            | — | From address (default `orders@supercleaner.in`). |
| `EMAIL_TO`              | — | Admin inbox for order notifications (set to `itee9910@gmail.com`). |
| `EMAIL_API_URL`         | — | Resend-compatible API base (default `https://api.resend.com`). |
| `WHATSAPP_ACCESS_TOKEN` | — | Meta WhatsApp Business Cloud API token. Enables **automatic** customer status messages. |
| `WHATSAPP_PHONE_NUMBER_ID` | — | Meta phone-number ID (used with the token above). |
| `SMS_API_URL`           | — | Generic SMS webhook URL. Enables automatic status messages via SMS. |
| `SMS_API_KEY`           | — | Bearer token sent to `SMS_API_URL`. |

Site content — brand name, WhatsApp number, email, address, GSTIN, hero copy, price visibility, social links — is configured **in the dashboard**, not via env vars.

---

## Switching from SQLite to PostgreSQL

The provider is already set to `postgresql` for production. The schema avoids SQLite-only features (no enums, no `Json` columns) so it works on both providers unchanged.

**Zero-setup SQLite sandbox** (optional — for local experiments without Postgres):

1. In `prisma/schema.prisma`, change `provider = "postgresql"` → `provider = "sqlite"`.
2. Set `DATABASE_URL="file:./dev.db"`.
3. Run `npm run db:push && npm run db:seed`.

**PostgreSQL** (production): just set `DATABASE_URL` and run `npm run db:push && npm run db:seed`.

---

## How ordering works

1. The customer builds a cart; every line stores `productId`, `packSizeId`, `quantity` and the label/price shown at that moment for the UI.
2. On submit, `POST /api/orders` runs rate-limiting → honeypot → Zod validation.
3. `createOrderRequest()` **re-reads everything from the database**: the product must still be active, the pack size must still exist and be active, it must not be out of stock, and per-product quantities must meet the MOQ. Prices are read from the database — **nothing from the client is trusted**.
4. Line items snapshot `productName`, `sku`, `packLabel`, `unitMrp`, `unitWholesale`, `quantity` and `lineTotal`, so later catalogue edits never change historical orders.
5. **Subtotal is computed from MRP.** Wholesale figures are stored for reference and are advisory — your team confirms them.
6. A unique reference (`SC-YYMMDD-XXXX`) is generated with retry-on-collision, and the order is saved with status **Pending Confirmation**.
7. A notification email is sent *best-effort* (never fails an order). The reference shown on the confirmation page only appears **after** a successful save.
8. Re-submitting the same `clientToken` returns the existing order instead of creating a duplicate.

Enquiries follow the same pattern through `POST /api/enquiries`.

---

## Order status workflow & notifications

Every order starts at **Pending Confirmation** and advances through:

```
Pending Confirmation → Confirmed → Processing → Shipped → Delivered
                                                     ↘ Cancelled (from any open state)
```

On the order detail page the admin gets:

- **Accept order** — one click to confirm a new order (the status select also allows any explicit change).
- **Mark as Processing / Shipped / Delivered** — the next logical step, one click.
- **Cancel order** — for any open order.
- **Internal notes** — staff-only text, never shown to the customer.
- A **status timeline** listing every change with its timestamp and notification outcome.

**Customer notification on status change.** Each status change messages the customer's own mobile number (taken from the order — never a number typed by hand):

1. **WhatsApp Business Cloud API** (if `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` are set) → sent automatically.
2. Otherwise **SMS webhook** (if `SMS_API_URL` + `SMS_API_KEY` are set) → sent automatically.
3. Otherwise the update panel shows a **one-click prefilled WhatsApp button** with the exact message already written — the admin presses it, WhatsApp opens the chat, and they press send. (WhatsApp cannot be auto-sent to an arbitrary number without a provider account.)

The outcome (`submitted`, `failed`, or `manual`) is shown in the panel and recorded permanently in the order's status timeline. Notification failures never block the status update itself, and no delivery/receipt is ever claimed — only what the provider accepted.

Message text is built by `buildStatusMessage()` in `src/lib/notify.ts` — neutral, factual sentences per status, with no promised dates or guarantees.

---

## Project structure

```
prisma/
  schema.prisma          Data model (Product, PackSize, Order, OrderItem, Enquiry, Setting, AdminUser)
  seed.ts                Admin user + settings + 12 starter products
  dev.db                 SQLite database (local only)
public/
  products/*.svg         Placeholder product images — replace with real photos
scripts/
  generate-placeholders.mjs   Regenerates the placeholder SVGs
src/
  app/
    (site)/              Public routes + the navbar/footer/cart shell
    admin/               Login page + (dashboard) group (overview/products/orders/enquiries/settings)
    api/
      orders|enquiries             Public write endpoints
      auth/login|logout            Session endpoints
      admin/*                      Guarded admin mutations
  components/
    cart|checkout|contact|home|layout|product|ui   Public UI
    admin                                     Admin forms & shell
  lib/
    auth|orders|products|settings|validation|rate-limit|whatsapp|email ...
  proxy.ts               Next 16 middleware — gates /admin and /api/admin
```

---

## Security notes

- **Auth** — bcrypt (cost 12) password hashing; signed, httpOnly, 8-hour session cookie; login responses never reveal whether an email exists; `proxy.ts` blocks unauthenticated admin requests and every `/api/admin/*` handler independently re-verifies the session.
- **Validation** — Zod schemas in `src/lib/validation.ts` are applied server-side to every request body; prices, pack sizes, availability and MOQs are re-checked against the database.
- **Rate limiting** — sliding window per IP (orders 8/min, enquiries 6/min, login 8 per 5 min). Implemented in-memory, which is appropriate for a single-instance MVP — swap `src/lib/rate-limit.ts` for a shared store (Redis/Upstash) before scaling horizontally.
- **Spam protection** — hidden honeypot field on the order and enquiry forms.
- **Duplicate orders** — idempotent creation via a client-generated `clientToken`.
- **Uploads** — `POST /api/admin/upload` rejects non-`image/*` types (only `image/png`, `image/jpeg`, `image/webp`, `image/avif`), rejects files over 5 MB and empty files, and writes to a random, non-guessable filename.
- **History integrity** — permanent delete is refused when a product appears in an order (`ProductInUseError` → HTTP 409); use *deactivate* instead.
- **Secrets** — `.env` is git-ignored; never commit `AUTH_SECRET` or database credentials.
- **No payment data** — there is no payment flow, gateway or card capture anywhere in the project.

---

## Caching & revalidation

Public reads are cached with Next.js Cache Components (`'use cache'` + `cacheLife` + tags):

| Tag        | Applied to                    | Invalidated by |
| ---------- | ----------------------------- | -------------- |
| `products` | Product lists & detail pages  | Any admin product mutation (`revalidateTag("products", "max")`) |
| `settings` | Layout, hero, footer, contact  | Saving settings |

`admin/*` routes use `export const instant = false` because they read a session on every request; public product detail pages stream behind `<Suspense>` (partial prerendering).

---

## Known MVP limitations

Things to address before or soon after launch:

1. **Images are stored on the local filesystem** (`public/uploads/`). That works on a persistent server, but **not on read-only serverless platforms** — swap `src/app/api/admin/upload/route.ts` for object storage (S3, Cloudinary, UploadThing) when you deploy there.
2. **Rate limiting is per-instance** (see above).
3. **Email is optional.** Without `EMAIL_API_KEY`/`EMAIL_TO`, order notifications are skipped silently — orders still save. Failures are logged and never fail an order.
4. **Automatic WhatsApp/SMS to customers is optional too.** Without Meta or SMS-provider credentials the admin sends each status message with one click from the order page (a prefilled WhatsApp button) — messages are never claimed as delivered.
4. **No customer accounts** — by design (out of scope).
5. **Placeholder content.** All product images, descriptions, hero copy, stats, social links and contact details are clearly replaceable placeholders. **Add your real products, photos, WhatsApp number, GSTIN and address from the dashboard before launch.** Do not publish claims (ingredients, certifications, performance) that you cannot substantiate.
6. **Policies are templates** (`/privacy`, `/terms`, `/shipping-returns`) written for this MVP. Have them reviewed for your jurisdiction and fill in the real company details.

---

## Testing

```bash
npx tsc --noEmit   # type check
npm run lint       # lint
npm run build      # production build (includes type check)
```

The smoke-tested flows are:

- Public pages render (home, catalogue, product detail, about, contact, policies) with correct titles.
- `robots.txt` disallows `/admin`; `sitemap.xml` lists active products.
- `/admin` redirects unauthenticated visitors; `/api/admin/*` returns 401 without a session.
- Login rejects wrong credentials and sets the session cookie on success.
- Product create / duplicate-SKU rejection / toggle / edit / delete.
- Settings save + invalid settings → 422.
- Order creation persists with an MRP-computed subtotal and `pending` status; confirmation page shows the reference.
- Enquiry creation, status update, and honeypot rejection.
- Cart: add to cart, `localStorage` persistence, quantity stepper, MOQ-aware submit.

---

## Deployment

```bash
# on your server / CI
cp .env.example .env          # set DATABASE_URL (Postgres), AUTH_SECRET, NEXT_PUBLIC_SITE_URL
npm ci
npm run build
npm run start
```

Checklist:

- [ ] `NEXT_PUBLIC_SITE_URL` set to the real HTTPS origin (affects sitemap/OG).
- [ ] `AUTH_SECRET` is a long random value, **not** the development one.
- [ ] Admin password changed from the default.
- [ ] `.env` never committed.
- [ ] Postgres `prisma migrate deploy` run for the release.
- [ ] Persistent filesystem **or** object storage for uploads.
- [ ] Real products, images, WhatsApp number, address and GSTIN entered in the dashboard.
- [ ] Privacy / Terms / Shipping pages reviewed.
- [ ] Optional email provider configured.

---

## Legal / content placeholders

- Brand name, manufacturer name, logo mark, tagline, hero and about copy, “why choose” benefits, WhatsApp number, email, phone, address and GSTIN are all configurable in **Settings**.
- Product images are generated SVG placeholders labelled *“Placeholder image — replace with real product photo.”*
- `public/products/*.svg` can be regenerated with `node scripts/generate-placeholders.mjs`.

---

## Out of scope

Not included, by agreement: product categories, customer accounts, distributor hierarchies, credit management, salespeople, loyalty programs, a mobile app, advanced analytics, online payments and enterprise features.
#   j k - i n d u s t r i e s  
 