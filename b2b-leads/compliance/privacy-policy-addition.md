# Privacy policy — missing section for B2B prospect data

## Why this is needed

Hospitrade's published privacy policy covers customers only: what is collected when
someone registers, orders, or contacts the shop. It does not mention marketing to
business prospects, data obtained from public sources, legitimate interests, the right
to object, or retention periods. Checked 2026-07-25 against the live policy — none of
those terms appear anywhere in it.

Outreach emails link to that policy as their privacy notice. Because prospect data is
**not collected from the individual**, UK GDPR **Article 14** applies, and it requires
telling the person: who the controller is, what data is held, the purposes and lawful
basis, the source of the data, retention, and their rights — including the right to
object to processing based on legitimate interests.

Until the policy says these things, the transparency condition in the LIA is unmet, and
sending stays blocked.

## Ready-to-publish text

Add as a new numbered section, before the "Contact" section. Plain wording deliberately
— it is meant to be understood, not to be impressive.

---

### Business contact information and B2B marketing

Alongside customer data, we process a limited amount of business contact information
about UK dental practices, clinics, laboratories, dental groups and trade buyers that we
have not yet done business with, so that we can introduce our supply service to them.

**What we hold.** The business name, address and website; a business email address and
telephone number; the name and job title of a relevant purchasing contact where that is
published; the services the business publicly states it offers; and our own note on why
our products may be relevant to them.

**Where we get it from.** Publicly available sources only — principally the business's
own website, alongside public business directories, NHS service directories, Companies
House, and authorised business-data providers. We do not buy personal data lists, and we
do not guess or construct email addresses.

**Why we do it, and our lawful basis.** Our lawful basis is **legitimate interests**
(UK GDPR Article 6(1)(f)). Our interest is in reaching the businesses that buy the
products we supply; we consider this proportionate because the data is business contact
information, the approach is relevant to the recipient's trade, the volume is small, and
you can stop it at any time with a single reply. We have carried out and documented a
Legitimate Interests Assessment, and we will provide it on request.

**How we contact you.** By email, to a business address. Any first email says plainly who
we are and why we are writing. We will send at most one introduction and two follow-ups,
after which we will not contact you again unless you get in touch with us.

**How to stop it.** Reply to any email with "unsubscribe", or email
sales@hospitrade.co.uk. We will remove your details from our outreach records on the
same working day and add them to a permanent do-not-contact list so you are not
contacted again by mistake. You do not have to give a reason. This is your right to
object under Article 21.

**How long we keep it.** Prospect records are deleted 24 months after our last contact,
unless a business relationship has begun, in which case the records become customer
records under the rest of this policy. Our do-not-contact list is kept indefinitely,
because that is what stops us contacting you again.

**Your other rights.** You can ask us for a copy of the information we hold about you,
ask us to correct it, or ask us to delete it. Contact sales@hospitrade.co.uk. If you are
not satisfied with how we have handled your information, you can complain to the
Information Commissioner's Office at ico.org.uk or on 0303 123 1113.

---

## Also worth fixing while in there

The existing policy has two gaps that affect customers, not just prospects, and both are
straightforward to close:

1. **No retention periods at all** — UK GDPR Art. 13(2)(a) requires them, or at least
   the criteria used to determine them.
2. **No mention of the ICO or the right to complain** — Art. 13(2)(d).

## How to publish

**This must be done by the owner.** The owner approved publishing it automatically on
2026-07-25, and the attempt was made via the Shopify Admin API, but it was refused:

```
Access denied for shopPolicyUpdate field.
Required access: `write_legal_policies` access scope.
```

The connected Shopify app holds read access to policies but not write. Nothing was
changed — the mutation was rejected before execution and returned null. A verbatim
backup of the pre-existing policy is not kept in this repo (it is customer-facing text
already public on the site), so no restoration is needed.

Two routes:

1. **Manual, recommended.** Shopify Admin → Settings → Policies → Privacy policy.
   Paste the section above at the end, as a new section 11. Save.
2. Grant the Shopify connection the `write_legal_policies` scope, then ask me again.

Note while editing: the policy's own contact section gives `info@hospitrade.co.uk`,
which is a **fourth** Hospitrade email address alongside `sales@`, the Shopify contact
address, and the owner's Outlook mailbox. Worth consolidating.
