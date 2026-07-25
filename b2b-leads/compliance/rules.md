# Compliance Gate — UK GDPR / PECR

Every lead passes this gate before an email is drafted. A lead that fails any REJECT
test is written to `data/rejected.csv` with the reason; a lead that trips a REVIEW test
is written to `data/manual-review.csv` and waits for the owner.

## 1. The legal position we are relying on

**PECR (reg. 22)** restricts unsolicited marketing by electronic mail to *individual
subscribers* — consumers, and importantly **sole traders and unincorporated
partnerships**. Marketing to **corporate subscribers** (limited companies, LLPs,
incorporated practices, public bodies) is not caught by that consent requirement.

**UK GDPR** still applies, because a named business contact and often a role-based
address are personal data. Our lawful basis is **legitimate interests (Art. 6(1)(f))**,
which requires a completed and retained Legitimate Interests Assessment
(`compliance/legitimate-interests-assessment.md`), transparency, and an unconditional
right to object honoured immediately.

Practical consequence, and the reason this system is built the way it is:

| Recipient | Address type | Outreach allowed? |
|---|---|---|
| Incorporated practice / group / lab | `info@`, `reception@`, `practice.manager@` etc. | Yes — LI basis + opt-out |
| Incorporated practice | named individual, e.g. `j.smith@practice.co.uk` | REVIEW — LI still possible, but must be justified per lead |
| **Sole trader / individual dentist practising in own name** | any | **REJECT** — needs prior consent under PECR |
| Any recipient | free webmail (gmail/outlook.com/yahoo/hotmail/icloud) | **REJECT** unless published explicitly as the business enquiry address, then REVIEW |
| Patient / private individual | any | **REJECT** |

Sole-trader detection is imperfect from a website alone. Treat as sole trader
(→ REJECT) where the business trades under a personal name with no "Ltd"/"Limited"/
"LLP" anywhere on the site or footer, e.g. "Dr A. Patel Dental Surgery". Where the
footer shows a company number, treat as corporate.

## 2. REJECT tests (hard fail, no email)

1. Business permanently closed, or website dead / parked / expired certificate.
2. Email address unverified — not seen on the business's own website or a listing the
   business controls. **Never construct, pattern-guess or infer an address.**
3. Address belongs to a patient, private individual, or is unrelated to the business.
4. Recipient has no plausible connection to purchasing (e.g. a clinical-complaints
   inbox, a recruitment inbox, a safeguarding contact).
5. Outside approved geography (non-UK).
6. Duplicate of an existing lead on any dedupe key (§4).
7. Present on `data/suppression-list.csv` for any reason.
8. Already an active Hospitrade customer (cross-check Shopify customers before drafting).
9. Previously hard-bounced.
10. Source's terms prohibit this use (e.g. scraped from a directory that forbids
    marketing use, or obtained via prohibited automation).
11. Sole trader / individual subscriber (see §1).
12. No credible reason the Hospitrade offer is relevant to them.

## 3. REVIEW tests (owner decides before drafting)

1. Named corporate mailbox rather than a role/generic mailbox.
2. Business type ambiguous (e.g. an aesthetics clinic that may or may not do dentistry).
3. Corporate status unclear — cannot tell sole trader from incorporated practice.
4. Contact form only, no email address published.
5. Lead score below 50.
6. Practice is part of a group whose head office may already be a customer or may
   have a central procurement contract.

## 4. Deduplication keys

Checked in this order; a match on any one is a duplicate:

1. Normalised email (lowercase, trim, strip dots in gmail local-part only)
2. Website registrable domain (strip `www.`, ignore scheme/path)
3. Normalised phone (digits only, strip leading `0`/`+44`)
4. Normalised business name + postcode (case/punctuation-insensitive)
5. LinkedIn company URL
6. Google Business place ID

## 5. Record kept for every accepted lead

Exact public source URL · date collected · purpose of collection · why the offer is
relevant to this business · lawful basis (always "legitimate interests" here) · whether
the address is corporate or personal · whether human approval is required · opt-out
status · suppression status. These are columns in `data/leads.csv`; there is no
separate register.

## 6. Suppression list

`data/suppression-list.csv` is **append-only and permanent**. Entries are never
deleted, including after a business changes hands. Reasons: `unsubscribed`,
`complaint`, `hard_bounce`, `no_further_contact`, `invalid_address`,
`existing_customer`, `owner_excluded`.

An unsubscribe request suppresses **both** the individual address **and** the business
domain, unless the sender asked only for themselves to be removed.

Opt-out requests are actioned on the same working day they are seen.

## 7. Signature and content requirements (hard blocks on sending)

- Sender identified as Hospitrade Ltd — no obscured or misleading sender name.
- Registered office address present.
- Company registration number and place of registration present
  (**currently missing — blocks all sending**, see `config/company-profile.md` §1).
- Working reply-based opt-out, honoured manually within one working day.
- Link to the privacy policy.
- Subject line describes the actual content; no false "Re:"/"Fwd:", no fake urgency,
  no implication of an existing relationship or prior conversation.
- No attachments on a first contact — link to `/pages/brochure` instead.
- No claim listed as BLOCKED or NEVER in `config/company-profile.md`.

## 8. Sending controls

Default mode is **DRAFT ONLY**. Sending requires the owner to say
"Enable approved sending mode", and even then:

- Max 10 emails per working day to start.
- Tuesday–Thursday, 09:30–16:30 UK time; not weekends or UK public holidays.
- Spread across the window, never a single batch in one minute.
- **One recipient per email.** Bulk BCC to unrelated businesses is prohibited: it is
  not personalised, it makes per-recipient opt-out tracking unreliable, and it carries
  a real risk of disclosing one practice's address to another if BCC is mishandled.
- Cooldown: no repeat contact to the same address inside the follow-up schedule.
- Automatic stop on: bounce rate >3%, any complaint, any Outlook restriction notice,
  or any domain/mailbox reputation warning.
- Never split across mailboxes or domains to evade a provider limit.
