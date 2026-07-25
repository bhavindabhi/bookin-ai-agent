# Owner Decisions Log

Append-only record of decisions the owner has made about this system. A scheduled run
starts with no memory of past sessions, so this file is the standing instruction set.

---

## 2026-07-25

**Drafting route — Outlook, pending authorisation.**
Drafts are to be created in the Hospitrade Microsoft 365 mailbox
`bhavin@hospitrade.co.uk`, so that outreach comes from the company domain rather than a
free webmail address. The Microsoft 365 connector currently attached to this
environment is **read-only** (mail/calendar/file search; no create-draft, no send), so
this is **blocked on the owner authorising an Outlook connector with mail-write scope**.
Until that is done, no drafts can be created in Outlook. Do not silently fall back to
the Gmail account — the owner chose the business mailbox deliberately.

**Claims — omit all quantified claims.**
No delivery timings, dispatch cutoffs, free-delivery thresholds, credit terms or
telephone numbers in any email, because the website states mutually inconsistent
versions of each. Use unquantified capability language only. See
`company-profile.md` §5.

**Campaign focus — all four angles in scope, disposables leading.**
The owner selected every option, so campaigns A–F are all live. Sequence the work:

1. **Disposables & infection control** — primary hook for general practices
   (Campaigns A, B). Highest repeat-purchase frequency, deepest verified range.
2. **Full clinical range** — broaden within practices and groups once a conversation
   opens (Campaigns A, B, C).
3. **Specialist / surgical clinics** — sutures, irrigation syringes, handpiece tubing,
   gowns; CE/ISO documentation on request is a genuine differentiator (Campaign F).
4. **Distributor & reseller partnerships** — the only segment where the consumer
   oral-care range may be mentioned (Campaign E).

Dental laboratories (Campaign D) remain in scope as an ask-first segment: the range fit
is partial, so those emails ask what the lab uses rather than assert a fit.

**Geography** — per the standing brief: London and Greater London, Harrow, Watford
first; then the rest of England, Scotland, Wales, Northern Ireland.

**Lead database location** — this repository, `b2b-leads/data/`.

### Still outstanding — these block sending

1. Company registration number (UK legal requirement on business email).
2. VAT number, or confirmation that Hospitrade is not VAT registered.
3. Sender name and job title for the signature.
4. Confirmation that the published privacy policy covers B2B prospect data, its source
   and the legitimate-interests basis (UK GDPR Art. 14).
5. Owner sign-off on the LIA.
6. Approved daily sending cap (default 10).
7. Exclusion list: existing customers and any businesses never to contact.
8. Whether a paid sample may be offered, and on which lines.
