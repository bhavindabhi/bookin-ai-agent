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
