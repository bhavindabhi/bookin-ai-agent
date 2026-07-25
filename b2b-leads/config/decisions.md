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

**Registered details — confirmed.** Company number 14914181, registered office
12 Knowles Court, 24 Gayton Road, Harrow, HA1 2HA. **Not VAT registered.** Signature is
Bhavin Darji, Director. Written into `config/sender.json`.

**Daily sending cap — 20 per working day.**
Set at the owner's instruction. I advised 10 on the grounds that hospitrade.co.uk has no
cold-outreach sending history and a cold domain ramping fast risks permanent spam
placement; the owner chose 20 and that is the operative figure. Recorded here so the
reasoning isn't lost, not to reopen it. The automatic stops are unchanged and are the
real protection: halt on bounce rate above 3%, on any complaint, on any provider
restriction, and on any reputation warning. If the first two weeks are clean at 20 there
is nothing more to do; if bounces climb, the auto-stop fires before reputation damage
compounds.

**Samples — free for multi-site groups only, paid for everyone else.**
- Multi-site dental groups (Campaign C): a free sample **may** be offered.
- All other segments: the verified paid sample option only (single surgical gown, £3.00).
- Never promise a free sample to a non-group prospect, and never promise free
  *shipping* of a sample, which has not been approved.

**Privacy policy** — owner approved automatic publishing of the new prospect-data
section, but the Shopify connection lacks `write_legal_policies`, so it was refused and
the policy is unchanged. Must be pasted manually. See
`compliance/privacy-policy-addition.md`.

### Still outstanding — these block sending

1. **Outlook mail-write access** — the chosen drafting route is unavailable until the
   owner authorises a connector with `Mail.ReadWrite` for `bhavin@hospitrade.co.uk`.
2. **Privacy policy section** — needs pasting into Shopify Admin (or the
   `write_legal_policies` scope granting so it can be done automatically).
3. **Where the lead database lives** — this repository is public, so leads and the
   suppression list cannot be committed. See README "Data location".

   Owner chose "keep the repo public, store the data in a Google Sheet" (2026-07-25).
   **That is not currently executable.** Checked: no Google Sheets or Google Drive
   connector is installed — the only Google connector is Google Calendar — and the
   installed Microsoft 365 tools are read-only (search only, no write), so Excel on
   OneDrive is not an option either. The MCP registry has no Google Sheets connector at
   all; Google Drive is the nearest equivalent.

   **Resolved 2026-07-25: Google Drive.** The owner will connect the Google Drive
   connector (`create_file`, `read_file_content`, `search_files`) at claude.ai →
   Connectors. The repository stays public and holds only code and config; `leads.csv`
   and `suppression-list.csv` live in Drive, read and rewritten each run.

   **DONE 2026-07-25.** Connector authorised by the owner; Drive folder
   "Hospitrade B2B Leads" created (`1tG7s-Z_C5E2I5X6IUyWHXHF_cXbSvqlz`) holding
   `leads_*.csv` and `suppression-list_*.csv`. Round-trip verified byte-exact, and the
   gate confirmed blocking a lead against the Drive-sourced suppression list. Full
   procedure in `data/STORAGE.md`.

   Two corrections to what was planned here:
   - The scripts are **not** pointed at Drive. Python cannot reach MCP connectors, so
     the agent syncs around the scripts instead; the scripts stay local-file-based.
   - The connector has **no update tool**, so saves are dated snapshots with
     newest-wins, not in-place edits.
4. **Additional exclusions** — the owner opted to supply a list of businesses to exclude
   beyond existing customers and competitors; not yet received.

Resolved: LIA sign-off · company number and registered office · VAT status · sender
name and title · daily cap · sample policy · claims ruling · campaign focus ·
exclusion approach.
