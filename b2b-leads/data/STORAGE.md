# Where the lead data actually lives

**Authoritative store: Google Drive, folder "Hospitrade B2B Leads"**
https://drive.google.com/drive/folders/1tG7s-Z_C5E2I5X6IUyWHXHF_cXbSvqlz
Owned by `hospitrade.uk@gmail.com`. Folder ID `1tG7s-Z_C5E2I5X6IUyWHXHF_cXbSvqlz`.

The CSVs in this directory are a **disposable local cache**, gitignored so they can
never reach this public repository. Drive is the source of truth. If the cache and Drive
disagree, Drive wins.

## Why snapshots rather than one file

The Google Drive connector has `create_file`, `copy_file`, `download_file_content`,
`read_file_content`, `search_files`, `get_file_metadata` and `get_file_permissions` —
and **no update or overwrite tool**. An existing Drive file cannot be modified in place.

So each save creates a new dated snapshot and the newest one is authoritative:

```
leads_YYYYMMDD-HHMMSS.csv
suppression-list_YYYYMMDD-HHMMSS.csv
```

Titles sort lexicographically in timestamp order, so "newest" is unambiguous. Old
snapshots are never deleted. For a suppression list this is a genuine benefit rather
than a workaround: it produces a dated, provable record of what we knew and when, which
is exactly what accountability under UK GDPR Art. 5(2) asks for.

## Correction to an earlier plan

An earlier note said the scripts would be pointed at the Drive files directly. **That is
not possible.** `validate_leads.py` runs under Python via the shell and has no access to
MCP connectors. The sync is therefore performed by the agent around the scripts, not
inside them. The scripts stay local-file-based and unchanged.

## The procedure — follow it in this order, every session

**1. Pull before doing anything.**
`search_files` with `parentId = '1tG7s-Z_C5E2I5X6IUyWHXHF_cXbSvqlz'`, take the
highest-timestamped `leads_*` and `suppression-list_*`, `download_file_content` each
(returns base64), decode into `data/leads.csv` and `data/suppression-list.csv`.

**2. Verify the pull.** Compare byte length and a SHA-256 of the decoded content against
what Drive reported. A silent truncation on the suppression list is the single most
dangerous failure this system has, because it converts "opted out" into "never asked".
If the hashes don't match, stop — do not draft.

**3. Work locally.** Research, score, run
`python3 scripts/validate_leads.py --check-templates`. Exit 1 means stop.

**4. Push a new snapshot** for whichever file changed, via `create_file` with a fresh
timestamp, `contentMimeType: text/csv` and `disableConversionToGoogleType: true`.
Conversion must stay disabled — letting Drive convert to a Google Sheet means reading it
back through a natural-language representation the connector explicitly warns may change
format, which is not safe for exact data.

**5. Re-download the snapshot just written and confirm it matches** before treating the
save as done.

**6. Never delete the local cache without having pushed.** An unpushed local suppression
entry is a lost opt-out.

## Verified working

Checked 2026-07-25, end to end:

- Round-trip fidelity: 802 bytes uploaded, 802 bytes returned, SHA-256 identical.
- The gate reads a Drive-sourced suppression list and blocked a test lead on a
  suppressed competitor domain (`dentalsky.com` → `owner_excluded`).

## What the suppression list contains

Described by category only. **Customer names, domains and addresses are deliberately not
written here** — this file is committed to a public repository, and disclosing who buys
from Hospitrade would hand a customer list to competitors. The entries themselves live in
the Drive snapshot.

- **7 competitor domains**, domain-level (`owner_excluded`). Named in the snapshot; these
  are public trade rivals, not customers.
- **5 existing customers on their own business domain**, domain-level.
- **5 existing customers on shared domains**, deliberately **email-level only**. Several
  Shopify customers use shared academic or professional mail providers. Suppressing those
  domains wholesale would block legitimate high-value prospects — one is a university
  whose dental institute is exactly the kind of training-centre lead we want, and another
  is a mail provider used by large numbers of unrelated UK practices. Email-level
  suppression removes the customer without removing the sector.
- **One relay domain**, domain-level — TikTok Shop proxy addresses, never real business
  domains.

### Three gaps the owner should know about

1. **The customer list may be incomplete.** Shopify's `list-customers` returns at most 50
   per call and this connector exposes no pagination cursor, so exactly 50 customers with
   orders were retrieved and there may well be more. The owner should export the full
   customer list from Shopify Admin so all of it can be suppressed.
2. **One existing customer cannot be suppressed reliably.** A dental practice that
   ordered through TikTok Shop has only a relay address on file, not its real email or
   domain. The relay is suppressed, but if that practice is later researched from its own
   website it will look like a fresh prospect and could be cold-emailed despite already
   being a customer. The owner should supply its real domain — details are in the Drive
   snapshot.
3. **Roughly 35 further customers use consumer webmail** (gmail, icloud, yahoo, hotmail
   and similar). They are not enumerated because the gate rejects every free-webmail
   address outright, so they cannot be contacted regardless.
