# Hospitrade B2B Lead Generation & Outreach System

Draft-only B2B lead pipeline for Hospitrade Ltd (UK dental supplier, Harrow).
Nothing in here sends email. Sending is unlocked only by the owner explicitly saying
"Enable approved sending mode", and even then every hard block below still applies.

## Layout

```
b2b-leads/
├── config/
│   ├── company-profile.md          Verified facts + APPROVED / BLOCKED / NEVER claims
│   ├── sender.json.example         Signature placeholders — copy to sender.json
│   └── campaigns/campaigns.md      Campaigns A–F, follow-ups, reply handling
├── compliance/
│   ├── rules.md                    The accept/reject/review gate
│   └── legitimate-interests-assessment.md   LIA — needs owner sign-off
├── data/
│   ├── leads.csv                   CRM table (42 columns)
│   └── suppression-list.csv        Append-only, permanent
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

Fix, in order of preference:

1. **Make the repository private**, then delete `data/.gitignore` and commit the live
   CSVs. Restores full function; one setting change.
2. Move the lead database to private storage outside git (private Sheet, database) and
   point the scripts at it.
3. Keep it public and run the pipeline as one-shot only, with the owner storing the CSVs
   themselves between sessions. Workable but fragile.

Until one of these is done, treat this system as ready-to-run but not yet
persistent-safe.

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

| Block | Cleared by |
|---|---|
| Company registration number missing from signature | Owner supplies it → `config/sender.json` |
| LIA not signed off | Owner signs `compliance/legitimate-interests-assessment.md` |
| Privacy policy may not cover prospect data | Owner confirms or updates it |
| Delivery, dispatch, free-delivery, credit and phone claims contradict each other across the site | Owner rules on the canonical version (`company-profile.md` §5) |
| Unverified address, sole trader, free webmail, suppressed, duplicate, unscored, score <50 without approval | Per-lead fixes |

`config/sender.json` **must be committed** — scheduled runs clone the repo fresh and
will otherwise have no signature values and refuse to draft.

## Scoring

Relevance 30 · decision-maker 20 · purchasing potential 20 · contact quality 15 ·
engagement opportunity 15. Totals: 80+ hot, 65–79 strong, 50–64 nurture,
below 50 needs explicit owner approval. `--rubric` prints the bands.

## Sending limits, once enabled

One recipient per email · max 10/working day · Tue–Thu 09:30–16:30 UK · spread across
the window · never weekends or UK public holidays · sequence capped at initial + 2
follow-ups then permanent stop · automatic halt on any complaint, >3% bounce rate, or
any provider/reputation warning.

**Bulk BCC is prohibited.** It isn't personalised, it makes per-recipient opt-out
tracking unreliable, and a BCC mistake discloses one practice's address to another.

## Mailbox

The owner's Microsoft 365 account is `bhavin@hospitrade.co.uk`. The connected
Microsoft 365 tools in this environment are **read-only** (search mail/calendar/files)
— there is no create-draft or send capability, so **Outlook drafts cannot currently be
created programmatically**. Options: the owner enables an Outlook connector with mail
write scope, or drafts are prepared in the Gmail account already connected
(`hospitrade.uk@gmail.com`), or drafts are supplied as text for manual paste.
See the pending owner decision in the session report.
