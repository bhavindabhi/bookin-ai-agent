# Dental Supply Outreach Agent

An agent for a dental products/materials business. It:

1. **Scrapes/discovers leads** — local and international dental clinics,
   labs, and distributors who might buy regularly.
2. **Sends a B2B outreach email automatically** from your Outlook account,
   introducing your business and that you trade B2B in dental materials.
3. **Logs replies** when a client gets back to you — and stops there.
   **Pricing and closing is on you**: you decide the number and reply
   yourself. The agent can optionally suggest a price against your own
   pricebook, but it never sends pricing or negotiates on its own.

## Setup

Requires Node.js 22 or later (uses the built-in `node:sqlite` module — no
native/compiled dependencies, so `npm install` works on a fresh machine with
no build tools required).

```sh
npm install
cp .env.example .env
```

Edit `.env`:

- `EMAIL_USER`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` —
  **required to actually send**. Sends via Microsoft Graph (app-only auth),
  not SMTP — most Microsoft 365 tenants now block Basic Auth/app passwords
  for SMTP, so this is the path that reliably works. One-time setup:
  1. In https://portal.azure.com → **App registrations** → **+ New
     registration**. Any name, default account type, no redirect URI.
  2. **API permissions** → **+ Add a permission** → **Microsoft Graph** →
     **Application permissions** → search `Mail.Send` → add it → click
     **Grant admin consent**.
  3. **Certificates & secrets** → **+ New client secret** → copy the
     **value** immediately (shown once).
  4. Copy the **Application (client) ID** and **Directory (tenant) ID**
     from the app's Overview page.
  5. Put all four into `.env` as shown in `.env.example`.

  Note: an app-only `Mail.Send` permission can send as *any* mailbox in the
  tenant, not just `EMAIL_USER`'s. For a solo/small setup that's usually
  fine; if you want it locked to one mailbox, ask your admin to add an
  Exchange **Application Access Policy** scoping this app to that mailbox
  only.
- `BUSINESS_NAME`, `SENDER_NAME`, `SENDER_EMAIL`, `BUSINESS_ADDRESS` —
  **required**. Used in every outreach email. A physical address is required
  by CAN-SPAM (US) and expected under GDPR/PECR (UK/EU) for B2B marketing
  email — see "Legal notes" below.
- `EMAIL_SEND_DELAY_MS` — delay between each send (default 4000ms). Keeps
  you under Graph/Exchange sending limits and avoids looking like a spam
  blast.
- `ANTHROPIC_API_KEY` — **optional**. Without it, outreach emails use a
  plain template (still fully functional). With it, each email is
  personalized per lead.
- `SERPAPI_KEY` / `GOOGLE_PLACES_API_KEY` — **optional**. Without either,
  lead discovery scrapes the web directly (DuckDuckGo search + fetching
  each result page for an email address) — free, no key needed, but
  noisier than a paid business-data API. Always spot-check a lead before
  trusting the scraped email.

## Workflow

```sh
# 1. Find leads (scrapes the web by default — no API key required)
npm run agent -- discover --region "United Kingdom" --category "dental clinic" --limit 10
npm run agent -- discover --region "United Arab Emirates" --category "dental supply distributor"

# 2. Send the B2B outreach email — this actually sends, for real, via Microsoft Graph
npm run agent -- outreach
# ...or preview first without sending anything:
npm run agent -- outreach --dry-run

# 3. When a client replies (you'll see it in your own Outlook inbox), log it:
npm run agent -- log-reply --lead-id 3 --text "Hi, interested — what's your price on gloves, 500 boxes?"
# The lead is now flagged "awaiting_pricing". The agent stops here on purpose.

# 4. Optional: get a suggested price against your own pricebook before replying yourself
npm run agent -- suggest-price --lead-id 3

# 5. You reply with the actual price yourself, directly in Outlook. Then:
npm run agent -- leads --status awaiting_pricing
npm run agent -- close-deal --lead-id 3 --won

# See everything at a glance
npm run agent -- dashboard   # writes dashboard.html — open it in a browser
npm run agent -- sent-log    # what's actually been sent, and what failed
```

Data is stored locally in `data/agent.db` (SQLite) — leads, sent-email log,
and client replies all persist between runs.

## Why the agent stops after logging a reply

Sending the first-touch outreach is safe to automate — it's a template
introduction, not a commitment. Pricing is a real business decision, so the
agent never computes-and-sends a counter-offer on its own. `suggest-price`
exists purely as a calculator you can consult; it prints a number to your
terminal and touches nothing else. You always write and send the actual
price yourself.

If you later want the agent to also *draft* (not send) a suggested reply
using your pricebook, that's a small addition on top of `suggest-price` —
ask and it can be wired in.

## Legal notes on cold outreach (read before scaling this up)

- **US (CAN-SPAM)**: B2B cold email is generally permitted, but every email
  needs your real physical address and a working opt-out — both are baked
  into the templates here.
- **UK/EU (PECR/GDPR)**: unsolicited B2B marketing email to *corporate*
  contacts (info@, sales@, a named business role) is generally lower-risk
  than to individuals, but you should still identify yourself clearly,
  state why you're contacting them, and honor opt-outs immediately. Avoid
  emailing personal/individual addresses without a lawful basis.
- **Sending limits / deliverability**: Microsoft 365 throttles and can flag
  accounts that suddenly send lots of near-identical emails. Keep
  `EMAIL_SEND_DELAY_MS` set, start with small batches (`--limit`), and
  watch `sent-log` for failures before scaling up.
- **Do-not-contact**: if anyone asks to stop hearing from you, run
  `do-not-contact --lead-id <id>` immediately.
- **Scraped emails**: the free web-scrape provider pulls email addresses it
  finds on public pages — verify a handful manually before a big send, it
  will occasionally pick up the wrong address (e.g. a webmaster/privacy
  contact instead of sales/procurement).
- This is general orientation, not legal advice — if you're going to send
  outreach at real volume internationally, it's worth a quick check with
  someone who knows the rules in the countries you're targeting.

## Project layout

```
src/
  leads/            lead discovery: mock / free web-scrape / SerpAPI / Google Places
  email/             Microsoft Graph sender (app-only auth)
  utils/             small shared helpers (sleep)
  pricing/          pricebook + rule-based negotiation engine (used only by suggest-price)
  outreach/         email composer (LLM or template) + reply parsing
  pipeline/         orchestration: discover, outreach, log-reply, suggest-price, leads, dashboard
  db/                SQLite schema + client
  cli.ts             command-line entry point
```
