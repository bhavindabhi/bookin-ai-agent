# Inventory Platform (Phase 1 + 2)

A general-purpose stock tracker for small UK shops — grocery, off-license,
street food stalls, or anything similar. Scan a product to sell it, watch
stock drop, see what's low, and turn that into an order to the right supplier.

This is **Phase 1 + 2**: one shop, one login, everything manual except the
scan → stock decrement itself. See "What's next" below for where this goes.

## What it does right now

- **Scan a barcode** (or type it and hit Enter) → stock for that product drops
  by 1, logged as a stock movement.
- **Products** — add/edit/delete: barcode, name, cost/sell price, current
  stock, reorder threshold, reorder quantity, assigned supplier.
- **Suppliers** — add/edit/delete: name, email, phone, notes.
- **Low stock** — every product at or below its reorder threshold, grouped by
  supplier, so you can see at a glance what to order from whom.
- **Draft reorder lists** — one click on the low-stock page creates a draft
  order per supplier (pre-filled with the low-stock items and their reorder
  quantities). Edit quantities, remove items, then **"Email this order"** —
  opens your own email app with the supplier's address, subject, and item
  list pre-filled, so you just hit send. No email-provider account or API
  key needed. Mark an order "sent" once you have.

## Scanning hardware

You don't need anything fancy. A cheap USB or Bluetooth barcode scanner
(£15–20, widely available) acts like a keyboard — it "types" the barcode
digits and hits Enter. The scan page is just a plain text input, so any such
scanner works with zero configuration. Phone-camera scanning (no extra
hardware at all) is a natural Phase 2 addition, not in this version.

## Setup

```bash
cp .env.example .env
# generate a session secret and paste it into .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm install
npx prisma migrate deploy   # creates prisma/dev.db from the committed migrations
npm run dev
```

Open `http://localhost:3001` — since no account exists yet, you'll land on
**Set up your account** to create the (single, for now) login. After that,
`/` is the scan page.

## Production

```bash
npm run build
npx prisma migrate deploy
npm start
```

Uses SQLite (`prisma/dev.db`) by default — fine for one shop on one server.
Deploy anywhere that runs Node 18+ and persists a local file (a VPS, or a
platform with a persistent disk/volume — SQLite doesn't work with
ephemeral/read-only filesystems). To move to Postgres later (needed once
this becomes multi-shop), change the `datasource` provider in
`prisma/schema.prisma` to `postgresql` and point `DATABASE_URL` at a real
database — the rest of the code doesn't change.

**Sessions** use `express-session`'s default in-memory store, which only
works for a single server process and forgets everyone on restart. Fine for
one shop; swap in `connect-pg-simple` or a Redis store before running more
than one instance.

## What's next (not built yet)

- **Phase 3** — multi-tenant: a `Business` model, a `businessId` column on
  every table, and a proper sign-up flow so any shop can create their own
  account instead of there being one hardcoded login.
- **Stretch** — phone-camera barcode scanning (no hardware scanner needed),
  WhatsApp integration for reorder notifications (reusing the patterns from
  the dental-supplier project once a real WhatsApp Business number is
  sorted), sales reporting, sending the order automatically (rather than via
  mailto:) once there's a reason to add an email-provider account.
