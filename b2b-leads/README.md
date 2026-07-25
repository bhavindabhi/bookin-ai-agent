# Hospitrade B2B Lead Generation & Outreach System

Draft-only B2B lead pipeline for Hospitrade Ltd (UK dental supplier, Harrow).
Nothing in here sends email. Sending is unlocked only by the owner explicitly saying
"Enable approved sending mode", and even then every hard block below still applies.

## Layout

```
b2b-leads/
├── config/
│   ├── company-profile.md          Verified facts + APPROVED / BLOCKED / NEVER claims
│   ├── decisions.md                Owner decisions — the standing instruction set
│   ├── sender.json                 Confirmed signature values (committed deliberately)
│   └── campaigns/campaigns.md      Campaigns A–F, follow-ups, reply handling
├── compliance/
│   ├── rules.md                    The accept/reject/review gate
│   ├── legitimate-interests-assessment.md   LIA — signed 2026-07-25
│   └── privacy-policy-addition.md  Prospect-data section awaiting publication
├── data/
│   ├── *.csv.template              Headers only — live CSVs are untracked, see below
└── scripts/
    ├── score_lead.py               0–100 scoring model
    └── validate_leads.py           The gate. Exits 1 if anything blocks.
```

## Data location — READ THIS FIRST

**This repository is public** (verified 2026-07-25 via the GitHub API:
`bhavindabhi/bookin-ai-agent` → `"visibility": "public"`).

Lead records and the suppression list are personal data. The suppression list is
especially sensitive: it is a record of who objected to being contacted. Publishing
either would be a UK GDPR breach and would hand Hospitrade's prospect and customer
lists to competitors.

Consequently `data/leads.csv` and `data/suppression-list.csv` are **untracked**
(`data/.gitignore`); only `*.csv.template` headers are committed. Nothing has leaked —
those files were header-only when this was found.

**The practical consequence:** scheduled runs clone this repo fresh, so with the live
CSVs untracked the pipeline **cannot persist leads or suppressions between runs**. That
makes recurring outreach unsafe — a permanent suppression list that doesn't persist
would let an opted-out practice be re-contacted, which is the single worst failure this
system can have.

**Resolved 2026-07-25 — the data lives in Google Drive and this is working.**

Authoritative store: Drive folder **"Hospitrade B2B Leads"**
(https://drive.google.com/drive/folders/1tG7s-Z_C5E2I5X6IUyWHXHF_cXbSvqlz), owned by
`hospitrade.uk@gmail.com`. The CSVs under `data/` are a gitignored local cache only.

Read **`data/STORAGE.md`** before touching lead data. Two things there matter most:

- The Drive connector has **no update tool**, so each save writes a new dated snapshot
  and the newest wins. Old snapshots are kept as an audit trail.
- The sync is performed **by the agent**, not by the scripts — Python has no access to
  MCP connectors, so `validate_leads.py` stays local-file-based and something must pull
  from Drive before it runs and push after.

Verified end to end on 2026-07-25: byte-exact round-trip (802 bytes, matching SHA-256),
and the gate correctly blocked a test lead whose domain was on the Drive-sourced
suppression list.

Existing Shopify customers are **not** copied into this repo. They are cross-checked
live against the Shopify customer list at validation time, which is both better data
minimisation and always current.

## Workflow

1. **Research** — authorised sources only (see below). Record the exact source URL.
2. **Verify** — open the business's own website and confirm it trades, and that the
   email address is published there. Never construct or pattern-guess an address.
3. **Score** — `python3 scripts/score_lead.py --relevance N --decision-maker N ...`
   Write the five components into `leads.csv`; the total is recomputed by the gate,
   so a hand-typed total can't drift from its parts.
4. **Gate** — `python3 scripts/validate_leads.py --check-templates`. Exit 1 means stop.
5. **Draft** — one email per recipient from the matching campaign template.
6. **Present** to the owner for approval. Do not send.

## Authorised sources

Permitted: the business's own website · Google Places API or another authorised
business-data API · NHS service directories · Companies House · public trade
directories whose terms allow this use · LinkedIn only via official API, Sales
Navigator features the owner holds, or owner-supplied exports/URLs · authorised
third-party lead providers.

Prohibited: scraping LinkedIn or Google Maps, hidden/undocumented APIs, CAPTCHA
circumvention, any automated extraction a platform's terms forbid, and constructing
email addresses from name patterns.

## Hard blocks on sending

Enforced by `validate_leads.py`; all must clear.

| Block | Status |
|---|---|
| Signature: company number, registered office, sender name | **Cleared** — `config/sender.json`, owner-confirmed 2026-07-25 |
| LIA not signed off | **Cleared** — signed 2026-07-25 |
| Contradictory delivery / credit / phone claims | **Cleared** — owner ruled: omit all quantified claims |
| Privacy policy doesn't cover prospect data | **OPEN** — text drafted in `compliance/privacy-policy-addition.md`, needs pasting into Shopify |
| No Outlook mail-write access | **OPEN** — drafts cannot be created until a connector with `Mail.ReadWrite` is authorised |
| Lead database has nowhere safe to live (public repo) | **OPEN** — see "Data location" above |
| Unverified address, sole trader, free webmail, suppressed, duplicate, unscored, score <50 without approval | Per-lead fixes, enforced automatically |

`config/sender.json` **must be committed** — scheduled runs clone the repo fresh and
will otherwise have no signature values and refuse to draft.

## Scoring

Relevance 30 · decision-maker 20 · purchasing potential 20 · contact quality 15 ·
engagement opportunity 15. Totals: 80+ hot, 65–79 strong, 50–64 nurture,
below 50 needs explicit owner approval. `--rubric` prints the bands.

## Sending limits, once enabled

One recipient per email · max 20/working day · Tue–Thu 09:30–16:30 UK · spread across
the window · never weekends or UK public holidays · sequence capped at initial + 2
follow-ups then permanent stop · automatic halt on any complaint, >3% bounce rate, or
any provider/reputation warning.

**Bulk BCC is prohibited.** It isn't personalised, it makes per-recipient opt-out
tracking unreliable, and a BCC mistake discloses one practice's address to another.

## Mailbox

Drafts go to the owner's Microsoft 365 mailbox `bhavin@hospitrade.co.uk`
(owner decision, 2026-07-25) so outreach comes from the company domain rather than a
free webmail address.

**This is currently blocked.** The connected Microsoft 365 tools are read-only — mail,
calendar and file *search* only, with no create-draft or send capability — so Outlook
drafts cannot be created programmatically. It needs a connector authorised with
`Mail.ReadWrite` for that mailbox.

Do **not** silently fall back to the Gmail account (`hospitrade.uk@gmail.com`) that
earlier agents used. The owner chose the business mailbox deliberately, and a dental
supplier cold-emailing practices from a free gmail.com address reads as less credible
and builds no reputation on hospitrade.co.uk.
