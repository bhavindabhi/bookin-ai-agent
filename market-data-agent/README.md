# UK Dental Market Report Agent

A scheduled Claude Code Remote routine that researches UK dental-practice market
data for Complete Smiles Dental Practice (Harrow, UK) and drops a draft email
into Gmail for review each week.

## What it does

Every run (fresh session, no memory of prior runs):

1. Researches four areas via web search / SEO tools:
   - Competitor landscape (Harrow / Greater London dental practices — pricing,
     offers, new services)
   - UK private/NHS dental pricing benchmarks
   - Search demand trends for local dental keywords
   - Recent UK dental industry news
2. Compiles the findings into a concise report with sources cited.
3. Creates a **Gmail draft** (not auto-sent) addressed to
   `hospitrade.uk@gmail.com`, subject `Weekly UK Dental Market Report — <date>`,
   for manual review and sending.

## Schedule

- Trigger: `UK Dental Market Report - Complete Smiles`
- Cron: `0 8 * * 1` (every Monday, 08:00 UTC)
- Runs in a fresh session each time (`create_new_session_on_fire`), so it
  never depends on any single chat session staying alive.

## Why a draft, not a direct send

Sending mail unattended requires an API key (e.g. Resend, matching the
`send-confirmation-email` pattern already used in the `sofia-smiles-ai`
Supabase app). To avoid storing a mail-provider secret in the scheduled
trigger, this agent uses the Gmail MCP connection already authorized for
`hospitrade.uk@gmail.com`, which only supports creating drafts — so every
report is reviewed by a human before it goes out.

## Changing it

- Adjust cadence/content: edit the trigger's cron expression or prompt via
  the Claude Code Remote trigger tools (`update_trigger`, `list_triggers`).
- Switch to auto-send: provide a Resend (or other) API key and update the
  routine to call that API directly instead of creating a Gmail draft.
