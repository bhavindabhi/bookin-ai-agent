# Outreach Templates

Rules that apply to every template below:

- One recipient per email. Never bulk BCC.
- Every double-brace placeholder must be filled from a **verified** field in
  `data/leads.csv`. An unfilled placeholder is a hard block on drafting.
- `{{verified_service_descriptor}}` and `{{town}}` must come from the practice's own
  website, checked on the verification date. If a detail was not actually verified,
  delete the clause — do not soften it into a vague claim.
- No delivery times, dispatch cutoffs, free-delivery thresholds, credit terms or
  telephone numbers: all BLOCKED (`config/company-profile.md` §5).
- No attachments. Link `/pages/brochure` if a catalogue is wanted.
- Shared footer below is appended verbatim to every email.

## Shared footer

```
--
{{SENDER_NAME}}
{{SENDER_TITLE}}
Hospitrade Ltd
sales@hospitrade.co.uk | hospitrade.co.uk
Registered in England and Wales, company no. {{COMPANY_NUMBER}}
Registered office: {{REGISTERED_OFFICE}}
{{VAT_LINE}}

You're receiving this business enquiry because {{business_name}} is publicly listed as
a UK dental provider. If you'd rather not hear from us, reply "unsubscribe" and we'll
remove your details straight away.
Privacy: https://hospitrade.co.uk/policies/privacy-policy
```

---

## Campaign A — Independent dental practice

**Subject:** `Dental supplies for {{business_name}}`

```
Hello {{greeting}},

I'm {{SENDER_NAME}} at Hospitrade Ltd, a dental supplier based in Harrow. I'm getting
in touch because {{business_name}} is listed as a {{verified_service_descriptor}}
practice in {{town}} — consumables are recurring spend, and a second quote is usually
worth having.

We supply UK practices with disposables and infection control (dental bibs, prophy cups
and brushes, cotton rolls, Type IIR masks, single-use gowns), along with hand
instruments, impression materials and restorative materials. Stock is held in the UK,
and we can source lines we don't list.

If it's useful, I'll price up three or four of your highest-volume lines so you have a
benchmark against your current supplier. No obligation — if we're not competitive,
you've still got a comparison.

Would that be worth having, or is there someone else who looks after purchasing?

Trade accounts: https://hospitrade.co.uk/pages/b2b
```

## Campaign B — Practice manager

**Subject:** `B2B dental supply enquiry for {{business_name}}`

```
Hello {{greeting}},

{{SENDER_NAME}} here from Hospitrade Ltd — we're a UK dental supplier in Harrow,
supplying consumables, PPE, instruments and materials to practices.

Two quick questions rather than a pitch:

1. Are you the right person for purchasing decisions at {{business_name}}, or should I
   speak to someone else?
2. Would you be open to us quoting on a few of your regular consumable lines?

If quoting is useful, tell me which lines matter most — usually gloves, bibs, masks,
prophy cups or composite — and I'll come back with trade pricing.

Trade accounts: https://hospitrade.co.uk/pages/b2b
```

## Campaign C — Multi-site dental group

**Subject:** `Dental consumables supply for your practice group`

```
Hello {{greeting}},

I'm {{SENDER_NAME}} at Hospitrade Ltd, a UK dental supplier based in Harrow. I'm
writing because {{business_name}} operates {{verified_site_count}} sites — group
purchasing is where consolidated consumables pricing tends to make a real difference.

We supply dental disposables, PPE and infection control, hand instruments, impression
and restorative materials to practices, groups and laboratories across the UK, and we
can set up recurring standing orders so sites don't run essentials down.

For a group your size, the sensible starting point is a schedule of your highest-volume
SKUs and a trade price against each. If you can share a consumables list — or your
current supplier's order history — I'll price it and you can compare directly.

Who handles procurement across the group?

Trade accounts: https://hospitrade.co.uk/pages/b2b
```

## Campaign D — Dental laboratory

**Subject:** `Dental material supply enquiry`

```
Hello {{greeting}},

I'm {{SENDER_NAME}} from Hospitrade Ltd, a UK dental supplier in Harrow. I'm getting in
touch because {{business_name}} is listed as a dental laboratory in {{town}}.

Labs buy differently from practices, so I'd rather ask than guess: which materials and
consumables do you go through most regularly? On our side the relevant ranges are
impression materials and trays, polishing consumables, stainless-steel hand instruments
and wire-forming pliers — and we source to order for lines we don't stock.

If you send a list of what you use routinely, I'll come back with trade pricing on
whatever we can supply and say plainly where we can't help.

Trade accounts: https://hospitrade.co.uk/pages/b2b
```

## Campaign E — Dental distributor / reseller

**Subject:** `UK dental trade partnership enquiry`

```
Hello {{greeting}},

I'm {{SENDER_NAME}} at Hospitrade Ltd, a UK dental supplier based in Harrow. I'm
contacting {{business_name}} about trade supply rather than retail.

We hold UK stock across dental disposables, PPE and infection control, instruments,
impression and restorative materials, and a consumer oral-care range (electric
toothbrushes, whitening kits, aligner accessories) that resells well alongside clinical
lines. We also source to order.

If wholesale or reseller supply is of interest, I can share trade pricing on whichever
categories fit your customer base. It would help to know roughly what volumes and
categories you're working with.

Trade and clinic accounts: https://hospitrade.co.uk/pages/trade-accounts
```

## Campaign F — Implant or surgical clinic

**Subject:** `Dental consumables for {{business_name}}`

```
Hello {{greeting}},

I'm {{SENDER_NAME}} from Hospitrade Ltd, a UK dental supplier in Harrow. I'm writing
because {{business_name}} is listed as offering {{verified_service_descriptor}} in
{{town}}, which usually means a steadier consumables and single-use requirement than
general practice.

Ranges most likely to be relevant: silk braided sutures with reverse cutting needles,
3ml irrigation syringes with 27G Luer-lock needles, handpiece irrigation tubing,
single-use fluid-resistant gowns and Type IIR masks, plus general disposables. CE
certificates, ISO documentation and safety data sheets are available on request if you
need them for your compliance file.

Happy to quote against your current pricing on whichever of those you use most — just
say which and I'll come back with figures.

Trade accounts: https://hospitrade.co.uk/pages/b2b
```

---

## Follow-up 1 — 5 working days after initial

Must be shorter than the initial email. Same thread, same subject.

```
Hello {{greeting}},

Just bringing this back to the top of your inbox in case it got buried.

If a trade price comparison on your regular consumables would be useful, I'm happy to
put one together — and if you'd rather I didn't follow up again, just say so and I'll
close the file.
```

## Follow-up 2 — 7 working days after follow-up 1, then stop permanently

```
Hello {{greeting}},

Last one from me — I won't chase again.

If consumables supply becomes something you want to review, hospitrade.co.uk has our
ranges and https://hospitrade.co.uk/pages/b2b covers trade accounts. Happy to help
whenever it's useful.
```

After follow-up 2 the lead is set to `sequence_complete` and never contacted again
unless they get in touch first.

---

## Reply-handling drafts

These are drafts for the owner, never auto-sent.

| Reply type | Action |
|---|---|
| Interested | Draft reply, notify owner same day. |
| Catalogue request | Link `/pages/brochure`. Never attach, never quote prices not in Shopify. |
| Pricing request | Pull live prices from Shopify only. Never estimate or round. Flag if a requested SKU isn't stocked. |
| Sample request | Do not promise a free sample. A paid sample SKU exists (single gown, £3.00). Escalate to owner. |
| Call / meeting | Check owner's Outlook calendar availability before proposing any time. |
| Already has a supplier | Offer to be a benchmark quote, once. If declined, stop. |
| Not interested | Thank them, stop the sequence, mark `not_interested`. |
| Unsubscribe | Suppress address **and** domain same working day, confirm removal, stop. |
| Out of office | Pause sequence to the stated return date; do not count as a contact. |
| Wrong contact | Politely ask for the purchasing contact — once only. |
| Complaint | Stop all contact immediately, suppress, notify owner with full details same day. |
| Delivery / service enquiry | Not a sales lead — forward to owner, do not answer on Hospitrade's behalf. |
