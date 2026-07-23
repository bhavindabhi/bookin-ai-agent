# Dental Supply Outreach Agent

An agent for a dental products/materials business. It:

1. **Discovers leads** — local and international dental clinics, labs, and
   distributors who might buy regularly.
2. **Drafts personalized outreach emails** for you to send from Outlook.
3. **Negotiates price** on inbound replies using pricing rules you set
   (floor price, volume discount tiers) — always as a **draft you approve**,
   never sent automatically.
4. **Tracks the pipeline** (new → contacted → negotiating → won/lost) so you
   can see who's where.

Nothing is ever emailed without you personally reviewing and hitting send.
This is deliberate — see "Why draft-only" below.

## Setup

```sh
npm install
cp .env.example .env
```

Edit `.env`:

- `ANTHROPIC_API_KEY` — **required**. Powers email drafting and reply
  understanding. Get one at https://console.anthropic.com.
- `BUSINESS_NAME`, `SENDER_NAME`, `SENDER_EMAIL`, `BUSINESS_ADDRESS` —
  **required**. Used in every outreach email. A physical address is required
  by CAN-SPAM (US) and expected under GDPR/PECR (UK/EU) for B2B marketing
  email — see "Legal notes" below.
- `SERPAPI_KEY` or `GOOGLE_PLACES_API_KEY` — **optional**. Without either,
  lead discovery uses a `mock` provider that returns sample leads so you can
  test the full pipeline before wiring up a real search source.
  - SerpAPI (https://serpapi.com) does Google-search-based discovery — wider
    net, noisier, will find blogs/directories as well as businesses.
  - Google Places API — verified business names/websites/phone via Google's
    business database, but rarely returns email addresses directly (you'll
    often need to check the website yourself before drafting outreach).

Edit `src/config/pricebook.example.json` (or point `PRICEBOOK_PATH` at your
own file) with your real products: list price, floor price (minimum you'll
accept), and volume discount tiers. The negotiation engine never proposes a
price below floor.

## Workflow

```sh
# 1. Find leads
npm run agent -- discover --region "United Kingdom" --category "dental clinic" --limit 10
npm run agent -- discover --region "United Arab Emirates" --category "dental supply distributor"

# 2. Draft outreach emails for every new lead with a contact email
npm run agent -- draft-outreach

# 3. Review drafts (terminal or open the dashboard)
npm run agent -- review
npm run agent -- dashboard   # writes dashboard.html — open it in a browser

# 4. Approve, then copy each into a new Outlook email and send it yourself
npm run agent -- approve --draft-id 1
npm run agent -- mark-sent --draft-id 1     # after you've actually sent it

# 5. When a reply comes in, paste it in and let the agent propose a response
npm run agent -- process-reply --lead-id 3 --text "Hi, interested — can you do 500 boxes of gloves at 4.50 each?"
npm run agent -- review
npm run agent -- approve --draft-id 2
npm run agent -- mark-sent --draft-id 2

# 6. Track outcomes
npm run agent -- leads --status negotiating
npm run agent -- close-deal --lead-id 3 --won
```

Data is stored locally in `data/agent.db` (SQLite) — leads, drafts, and
deals all persist between runs.

## Why draft-only

Two things need a human in the loop before this can safely run unattended:

- **Sending as you** requires an Azure AD app registration with Microsoft
  Graph `Mail.Send` permission on your Outlook account. That's a real step
  with real access — worth doing once you trust the drafts it's producing.
- **Committing to a price** is a business decision. The negotiation engine
  computes a recommended offer within the bounds you set, but it's a draft
  until you approve it.

Once you're happy with the quality of drafts, the natural next step is
wiring `mark-sent` up to actually call the Microsoft Graph `sendMail` API
instead of being a manual step — the codebase is structured so that's a
small, isolated change (replace the manual "paste into Outlook" step in the
workflow above with an authenticated Graph API call).

## Legal notes on cold outreach (read before scaling this up)

- **US (CAN-SPAM)**: B2B cold email is generally permitted, but every email
  needs your real physical address and a working opt-out — both are baked
  into the templates here.
- **UK/EU (PECR/GDPR)**: unsolicited B2B marketing email to *corporate*
  contacts (info@, sales@, a named business role) is generally lower-risk
  than to individuals, but you should still identify yourself clearly,
  state why you're contacting them, and honor opt-outs immediately. Avoid
  emailing personal/individual addresses without a lawful basis.
- **Do-not-contact**: if anyone asks to stop hearing from you, mark that
  lead `do_not_contact` (add a CLI hook or update the DB directly) and never
  draft outreach to them again.
- This is general orientation, not legal advice — if you're going to send
  outreach at real volume internationally, it's worth a quick check with
  someone who knows the rules in the countries you're targeting.

## Project layout

```
src/
  leads/            lead discovery (provider interface + mock/SerpAPI/Places)
  pricing/          pricebook + rule-based negotiation engine
  outreach/         LLM email drafting + reply parsing
  pipeline/         orchestration: discover, draft, process-reply, review, dashboard
  db/                SQLite schema + client
  cli.ts             command-line entry point
```
