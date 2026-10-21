# الأطرش أونلاين — Al-Attrash Online

A complete Arabic (RTL) ordering and delivery platform for **سلسلة محلات الأطرش** (Instagram [@al_attrash_](https://instagram.com/al_attrash_)): 15 shops inside Aleppo, free delivery to every area, open 24/7. Built by **Solunera** (Kamel Nassif).

It has four parts in one codebase:

| App | URL | Who uses it |
|---|---|---|
| Customer store (mobile-first PWA) | `/` | Customers across Aleppo |
| Admin dashboard | `/admin` | The owner, branch managers and cashiers |
| Driver app | `/driver` | Delivery drivers, from their phones |
| Live order tracking | `/order/AT-xxxxx` | Customers, refreshes itself |

---

## What's new in this version (vs. the Ammar build)

**Brand**
- Full الأطرش identity: signature yellow `#FFD21F` and ink black, the cart-with-24-clock mark redrawn as vector (logo, favicon, PWA icons), and their own voice in the copy ("أستاذ القهوة", "الأطرش ما بينام").
- Animated brand intro on the first visit, a live black ticker (open now · free delivery · 15 branches · cash on delivery), and a hero slider with floating real packshots and mouse parallax.

**Real product photos**
- 236 products, almost all with **real photos**: packaged goods use real front photos from Open Food Facts / Open Products Facts / Open Beauty Facts (Pepsi, Pringles, Takis, Kinder, Nescafé, Najjar, La Vache qui rit, Fairy, Ariel, Aseel ghee, Aleppo soap…). Fresh produce and bulk items use Unsplash photos.
- `npm run images:pull` copies every photo into your own storage (Supabase Storage on Render, `storage/uploads` on a VPS) and points the database at the copies, so the shop never depends on those hosts. The Docker `migrate` job runs it automatically.

**Branches and delivery**
- New **branches** table and *Admin → الفروع* page (orders per branch for the last 7 days). Each delivery zone is linked to the branch that serves it.
- The customer picks their area once from the header (search, ETA, which branch serves them). Checkout, the cart bar and tracking all use it.
- Delivery is free for every zone and there is no minimum order (both are settings, so this can change).

**Shopping UX**
- Toters-style **quick add**: a yellow "+" on every card that grows into a black stepper, with a flying thumbnail, cart jump and sparks. Weight items (produce, Al-Attrash coffee, nuts) add their default step (1 كغ or ربع كغ).
- **Ready-made baskets** (سلة السهرة، ترويقة الصبح، عدّة المراجعة، تنظيفة البيت): every item goes into the cart in one tap. Edit them in `src/lib/bundles.ts`.
- **"أستاذ القهوة" coffee stage** with animated steam, plus "سهرة الليلة", offers on yellow with a countdown, and a 15-branches band.
- **Out-of-stock preference** at checkout: replace with similar / call me / remove. It is saved on the order and shown to the branch, the driver and in the WhatsApp alert.
- **Live tracking map**: a scooter rides from the branch to the customer's area as the order moves, with confetti on placing and on delivery.
- Instant search that tolerates Arabic spelling (أ/ا، ة/ه، ى/ي), with trending terms and quick add right in the results.

**Admin**
- "Commission saved" banner on the dashboard: 20% of online sales that would have gone to a delivery app.
- Branch name and substitution choice on every order (admin, driver, WhatsApp alert).

Everything from the original build is still here: weight products, SYP/USD toggle, coupons, loyalty points, ratings, reorder, favourites, CSV/Excel import, printable invoices, driver flow, role-based security, rate limiting.

---

## Tech stack

- **Next.js 15** (App Router, Server Actions), **TypeScript**, **Tailwind CSS**
- **PostgreSQL** with **Drizzle ORM** (pure JS, no engine binaries to download)
- Cairo font (self-hosted), Recharts, Zustand, lucide-react, Papaparse
- Docker + docker-compose, standalone Next.js output

All money values are integers in **new Syrian pounds** (the 2026 lira, two zeros removed).

---

## Run locally

```bash
cp .env.example .env              # set DATABASE_URL + AUTH_SECRET
npm install
npm run db:push                   # create tables
npm run db:seed                   # catalogue, branches, zones + demo orders (FORCE_SEED=1 to wipe and re-seed)
npm run images:pull               # optional: copy all product photos to your own storage
npm run dev                       # http://localhost:3000
```

## Deploy on Render + Supabase (free)

1. **Supabase**: create a project (region: Frankfurt, closest to Syria/Lebanon). Save the database password.
   - *Connect → Session pooler* → copy the URI (Render can't reach the direct `db.xxx.supabase.co` host because it's IPv6 only).
   - *Project Settings → API* → copy the **Project URL** and the **service_role** key.
2. **Create the tables, seed and copy the photos** (once, from your computer). Put the three values in `.env`, then:
   ```bash
   npm install
   npm run db:setup:supabase      # tables + catalogue + branches + demo orders + photos → Supabase Storage
   ```
   The photo step creates a public `uploads` bucket and copies every product photo into it, so the shop no longer depends on Open Food Facts or Unsplash.
3. **Render (Docker service)**: the Dockerfile's last stage is made for Render. On first boot it creates the tables, seeds the catalogue and copies the photos to Supabase Storage by itself (`scripts/render-start.sh`), so step 2 is optional there. Set `FORCE_DB_SETUP=1` for one deploy after a schema change.
   **Render (Node service)**: push the code to GitHub, then *New → Blueprint* and pick the repo (it reads `render.yaml`), or *New → Web Service* with:
   - Build: `npm ci && npm run build` · Start: `npm run start` · Node 22 · Health check `/api/health`
   - Env vars: `DATABASE_URL`, `AUTH_SECRET` (long random string), `NEXT_PUBLIC_SITE_URL` (your onrender.com URL), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Open the site, log in at `/staff-login` with the demo admin, and change the passwords.

**Free tier notes:** a free Render instance sleeps after 15 minutes without visits, so the first visit after that takes ~30–60 s. Point a free uptime pinger (e.g. UptimeRobot, every 5 minutes) at `https://YOUR-APP.onrender.com/api/health` to keep it awake. A free Supabase project pauses after a week with no activity; the pinger hits the database too, which keeps it active.

## Deploy with Docker (VPS)

```bash
cp .env.example .env              # set AUTH_SECRET, DB_PASSWORD, SITE_URL; SEED_DEMO=0 for a clean launch
docker compose up -d --build
```

The `migrate` job creates the tables, seeds once (it never wipes existing data) and caches the photos into the `uploads` volume. Put Nginx or Caddy in front for HTTPS.

## Demo accounts (change them before going live)

| Role | Phone | Password |
|---|---|---|
| Admin | 0900000001 | Attrash@2026 |
| Staff | 0900000002 | Staff@2026 |
| Driver | 0900000011 / 0900000012 | Driver@2026 |
| Customer | register at `/register` | — |

Staff and drivers log in at **`/staff-login`**.

---

## Before launch: checklist with the client

1. **Logo:** `src/components/ui/Logo.tsx` and `public/brand/` are a vector redraw of the logo on their Instagram. Ask for the original file and swap it in.
2. **Branches:** the 15 branches are placeholders named by area. Enter the real shops in *Admin → الفروع*, then link each area in *Admin → مناطق التوصيل*.
3. **Products and prices:** the catalogue is a **sample** of what their shelves carry, with prices estimated from autumn-2026 Aleppo levels (~138 SYP per dollar). Download the template from *Admin → Products → Import from Excel*, fill in their real items and prices, and upload it.
4. **Photos:** run `npm run images:pull` on the server so photos are stored locally. For products without a photo, upload one or put an image URL in the CSV.
5. **WhatsApp:** the store number is set to 0965200322 (from their Instagram bio). Set the WhatsApp number in *Settings*, and fill `CALLMEBOT_PHONE` / `CALLMEBOT_APIKEY` for instant new-order alerts (or swap `src/lib/whatsapp.ts` for the WhatsApp Cloud API).
6. **Exchange rate, delivery fees, time slots:** check them in *Settings* and *Delivery zones*.
7. Change all demo passwords from *Admin → Team*.

## Photo credits

Packshots come from the Open Food Facts family of open databases (openfoodfacts.org, openproductsfacts.org, openbeautyfacts.org), licensed CC BY-SA. Produce and lifestyle photos come from Unsplash.

## CSV columns

`sku, name, category, sold_by, price, compare_price, stock, unit, brand, barcode, image, description`. Set `sold_by` to `weight` for products sold by weight; `price` is then per kg and `stock` is in kg. Arabic headers work too: `الاسم, القسم, السعر, السعر_قبل, الكمية, الوحدة, الماركة, الرمز, الباركود, الصورة, الوصف`.
If a row's SKU already exists, that product is updated; otherwise a new one is created.

---

© سلسلة محلات الأطرش. Designed and developed by **Solunera** · [@soluneragency](https://instagram.com/soluneragency)
