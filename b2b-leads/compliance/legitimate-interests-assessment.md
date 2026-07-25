# Legitimate Interests Assessment (LIA)

**Controller:** Hospitrade Ltd, 42 Bessborough Road, Harrow, HA1 3DL
**Processing:** Identifying UK dental businesses from public sources and sending a
single-recipient B2B introduction email, with up to two follow-ups, offering dental
consumables supply and trade accounts.
**Prepared:** 2026-07-25 · **Status: DRAFT — requires owner sign-off before any send**
**Review due:** every 12 months, or on any change to targeting or volume.

This is the record UK GDPR Art. 6(1)(f) requires us to be able to produce. It must be
signed off by the owner and retained. Sending without sign-off is a hard block.

---

## Part 1 — Purpose test: is there a legitimate interest?

**The interest.** Hospitrade is a UK dental supplier that needs to reach the businesses
that buy dental consumables in order to trade at all. Direct B2B approach is the normal
and expected route to market in this sector; practices are routinely contacted by
suppliers such as Henry Schein, Dental Sky and Wright Cottrell.

**Who benefits.** Hospitrade, from a pipeline of trade accounts. The recipient
potentially benefits too: a further competitive supplier for goods they already buy,
with UK-held stock and sourcing-to-order.

**How important is it.** Commercially significant but not urgent or vital. This
weighs against any intrusive method, which is why volume is capped, personalisation is
required, and the default posture is draft-and-review.

**Would it be unlawful or unethical without more?** No — provided the recipient is a
corporate subscriber, the approach is honest about who is writing and why, and an
opt-out is offered and honoured. Contacting sole traders without consent *would* breach
PECR, so they are excluded at the gate.

**Conclusion:** legitimate interest established, of moderate weight.

## Part 2 — Necessity test: is the processing necessary?

Reaching a practice's purchasing decision-maker requires knowing the practice and an
address that reaches it. There is no less-intrusive way that achieves the same purpose:

- Inbound marketing alone does not reach practices that have never heard of Hospitrade.
- Paid advertising does not reach a named practice's purchasing contact.
- Postal mail is slower, costlier and processes the same business data anyway.

The processing is limited to what the purpose needs: business identity, business
contact details, publicly stated services, and a note on why the offer is relevant.
Deliberately excluded: any special-category data, anything about patients, individual
dentists' personal or professional histories, and any data not needed to decide whether
the supply offer is relevant.

**Conclusion:** necessary, and minimised.

## Part 3 — Balancing test: do the individual's interests override?

**Nature of the data.** Business contact data, predominantly role-based mailboxes
(`info@`, `reception@`, `procurement@`). No special-category data. Low sensitivity.

**Source.** Only the business's own website or listings the business controls, and
authorised providers/APIs. No scraping in breach of platform terms, no CAPTCHA
circumvention, no address guessing or pattern-construction.

**Reasonable expectations.** A UK dental practice that publishes `info@` on its website
reasonably expects supplier enquiries to that address. This is the ordinary traffic of
the sector. Expectations would *not* extend to a named clinician's mailbox used for
patient care — hence the REVIEW gate on named addresses.

**Possible impact.** Minor: an unwanted email, and the small time cost of reading or
deleting it. No decision is made about anyone, no profiling of individuals, no
enrichment beyond public business facts, no sale or sharing of the data.

**Safeguards actually in place.**
- Corporate subscribers only; sole traders excluded.
- One recipient per email — no bulk BCC.
- Maximum three contacts ever (initial + 2 follow-ups), then permanent stop.
- Any reply that declines, or any silence after the sequence, ends contact.
- Permanent, append-only suppression list; opt-out actioned same working day.
- Volume capped at 10/day; drafts reviewed by a human before sending.
- Every email identifies Hospitrade, gives the registered address, links the privacy
  policy, and carries a reply-based opt-out.
- No claim may be made that is not verified in `config/company-profile.md`.

**Would the recipient object?** Some will, and that is anticipated and cheap to remedy:
one reply removes them permanently.

**Conclusion:** the recipient's interests do not override the legitimate interest,
given the low sensitivity of the data, the sector norm, the strict volume cap, and the
immediate and permanent opt-out.

---

## Outcome

Legitimate interests is an appropriate lawful basis for this processing, **conditional
on** all of the following remaining true. If any ceases to be true, this LIA is void
and processing stops until it is redone:

1. Recipients are corporate subscribers; sole traders and individuals are excluded.
2. Emails are single-recipient and genuinely personalised.
3. Volume stays at or below the approved daily cap.
4. Opt-outs are honoured same working day and permanently.
5. The maximum of three contacts is never exceeded.
6. Every factual claim is verified against `config/company-profile.md`.
7. A privacy notice is linked in every email and covers this processing —
   **the owner must confirm the published privacy policy actually describes
   B2B prospect data and the legitimate-interests basis. If it does not, it needs
   updating before any send.**

## Transparency obligation

Recipients are given the "why you" explanation inline in the email body and a privacy
policy link in the footer. Because the data is not collected from the individual, UK
GDPR Art. 14 applies; the privacy policy must therefore cover categories of prospect
data, source, lawful basis, retention and objection rights.

## Retention

Accepted leads: 24 months from last contact, then deleted unless a commercial
relationship began. Rejected leads: reason and dedupe keys only, 12 months.
Suppression list: retained indefinitely — that is its purpose, and is itself justified
by legitimate interests in not re-contacting people who asked us not to.

---

**Owner sign-off**

- **APPROVED AS WRITTEN — 2026-07-25**, by the holder of `bhavin@hospitrade.co.uk`,
  owner of Hospitrade Ltd. Printed name to be recorded with the email signature
  details (see `config/decisions.md`).
- Approval covers this assessment in full, including the seven conditions in
  "Outcome" above. If any of those conditions stops being true, this LIA is void and
  processing stops until it is redone.
- I confirm the published privacy policy covers this processing: ☐ *(outstanding)*
- I confirm the company registration number and VAT status for the signature:
  ☐ *(outstanding)*
- Approved daily sending cap: ________ *(outstanding, default 10)*

The three outstanding items above do not affect the validity of this assessment, but
each remains an independent hard block on sending.
