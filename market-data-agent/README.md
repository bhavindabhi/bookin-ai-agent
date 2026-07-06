# Dental Market Agents (Hospitrade Ltd)

Two separate scheduled Claude Code Remote routines. Both run in a fresh
session each time (`create_new_session_on_fire`), so neither depends on any
single chat session staying alive, and both write to Gmail **drafts** only —
nothing sends automatically.

## 1. UK Dental Market Report (internal intelligence)

- Trigger: `UK Dental Market Report - Complete Smiles`
- Cron: `0 8 * * 1` (every Monday, 08:00 UTC)
- Recipient: `hospitrade.uk@gmail.com` only (internal use)

Each run researches four areas via web search / SEO tools and drafts a
report email:
- Competitor landscape (Harrow / Greater London dental practices — pricing,
  offers, new services)
- UK private/NHS dental pricing benchmarks
- Search demand trends for local dental keywords
- Recent UK dental industry news

## 2. UK Dental Practice Outreach (Hospitrade Ltd marketing)

- Trigger: `Hospitrade Outreach - UK Dental Practices`
- Cron: `0 9 * * 3` (every Wednesday, 09:00 UTC)
- Recipient: a batch of ~50 UK dental practices per run, all in **Bcc** on a
  single Gmail draft addressed to `hospitrade.uk@gmail.com` (so recipients
  never see each other's addresses)

Each run:
1. Finds ~50 UK dental practices (generic business inboxes, e.g. `info@`,
   `reception@`) that are **not already in** `contacted-practices.csv`.
2. Drafts a short B2B marketing email introducing Hospitrade Ltd as a
   dental material supplier, with the legally required footer (company
   name, postal address, opt-out instructions).
3. Creates the draft with those addresses in Bcc, for manual review/send.
4. Appends the newly-found practices to `contacted-practices.csv` and
   commits/pushes the update, so future runs never re-target them.

### Compliance basis (UK PECR)

- Targets generic business inboxes at UK dental practices (corporate
  subscribers), not named individuals — B2B marketing to corporate
  subscribers doesn't require prior opt-in under PECR, unlike marketing to
  individuals/sole traders.
- Every email identifies the sender (Hospitrade Ltd), includes a real
  postal address (42 Bessborough Road, Harrow, HA1 3DL), and offers a
  working opt-out (reply "unsubscribe").
- **Caveat**: `contacted-practices.csv` is updated when the draft is
  created, not when it's actually sent. If a week's draft is discarded
  instead of sent, those practices are still marked contacted and won't be
  retargeted — deliberately conservative to avoid ever double-emailing the
  same practice.

## Why drafts, not direct send

Sending mail unattended requires an API key (e.g. Resend, matching the
`send-confirmation-email` pattern already used in the `sofia-smiles-ai`
Supabase app). To avoid storing a mail-provider secret in a scheduled
trigger, both agents use the Gmail MCP connection already authorized for
`hospitrade.uk@gmail.com`, which only supports creating drafts — so every
email, internal or outreach, is reviewed by a human before it goes out.

## Changing either agent

Use the Claude Code Remote trigger tools (`update_trigger`, `list_triggers`,
`fire_trigger`) to adjust cadence, batch size, or prompt content.
