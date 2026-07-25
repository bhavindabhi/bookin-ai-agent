#!/usr/bin/env python3
"""Validation gate for the Hospitrade B2B lead pipeline.

Run before any drafting. Exits non-zero if anything blocking is found, so it can be
wired into a pre-send check.

    python3 scripts/validate_leads.py
    python3 scripts/validate_leads.py --check-templates
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from score_lead import categorise, score  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LEADS = ROOT / "data" / "leads.csv"
SUPPRESSION = ROOT / "data" / "suppression-list.csv"
SENDER = ROOT / "config" / "sender.json"
TEMPLATE_FILES = [
    ROOT / "config" / "campaigns" / "campaigns.md",
    ROOT / "config" / "company-profile.md",
]

EXPECTED_COLUMNS = [
    "lead_id", "business_name", "business_category", "website", "address", "town",
    "postcode", "region", "contact_name", "job_title", "email", "email_type", "phone",
    "linkedin_url", "google_business_url", "official_website_source", "source_url",
    "date_collected", "verification_date", "verification_status", "corporate_status",
    "score_relevance", "score_decision_maker", "score_purchasing",
    "score_contact_quality", "score_engagement", "lead_score", "lead_category",
    "relevant_services", "likely_requirements", "recommended_campaign",
    "relevance_justification", "lawful_basis_status", "approval_status",
    "initial_email_date", "followup_1_date", "followup_2_date", "reply_status",
    "opportunity_status", "owner_notes", "opt_out_status", "suppression_reason",
]

FREE_WEBMAIL = {
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.co.uk",
    "live.com", "live.co.uk", "yahoo.com", "yahoo.co.uk", "icloud.com", "me.com",
    "aol.com", "btinternet.com", "sky.com", "msn.com", "protonmail.com", "gmx.com",
}

VALID_CAMPAIGNS = {"A", "B", "C", "D", "E", "F"}

BLOCK, WARN = "BLOCK", "WARN"


class Issue:
    __slots__ = ("severity", "lead", "message")

    def __init__(self, severity: str, lead: str, message: str) -> None:
        self.severity, self.lead, self.message = severity, lead, message

    def __str__(self) -> str:
        return f"[{self.severity}] {self.lead or '-'}: {self.message}"


# ---------- normalisation for dedupe ----------

def normalise_email(value: str) -> str:
    value = (value or "").strip().lower()
    if "@" not in value:
        return value
    local, _, domain = value.partition("@")
    # Only Gmail treats dots in the local part as insignificant.
    if domain in {"gmail.com", "googlemail.com"}:
        local = local.replace(".", "")
    local = local.split("+", 1)[0]
    return f"{local}@{domain}"


def registrable_domain(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"^[a-z]+://", "", value)
    value = value.split("/", 1)[0].split("?", 1)[0]
    value = re.sub(r"^www\.", "", value)
    return value


def normalise_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("44"):
        digits = digits[2:]
    return digits.lstrip("0")


def normalise_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


# ---------- loading ----------

def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    if not path.exists():
        return [], []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return (reader.fieldnames or []), [row for row in reader]


def load_suppression() -> tuple[set[str], set[str], dict[str, str]]:
    _, rows = read_csv(SUPPRESSION)
    emails, domains, reasons = set(), set(), {}
    for row in rows:
        email = normalise_email(row.get("email", ""))
        domain = registrable_domain(row.get("domain", ""))
        reason = (row.get("reason") or "unspecified").strip()
        if email:
            emails.add(email)
            reasons[email] = reason
        if domain:
            domains.add(domain)
            reasons[domain] = reason
    return emails, domains, reasons


# ---------- checks ----------

def check_schema(header: list[str]) -> list[Issue]:
    if not header:
        if (LEADS.parent / f"{LEADS.name}.template").exists():
            return [Issue(BLOCK, "", f"{LEADS.name} not present. It is untracked "
                                     "because this repository is public — see "
                                     "data/.gitignore. Copy leads.csv.template to "
                                     "leads.csv to work locally.")]
        return [Issue(BLOCK, "", f"{LEADS.name} is missing or has no header row")]
    issues = []
    missing = [c for c in EXPECTED_COLUMNS if c not in header]
    extra = [c for c in header if c not in EXPECTED_COLUMNS]
    if missing:
        issues.append(Issue(BLOCK, "", f"leads.csv missing columns: {missing}"))
    if extra:
        issues.append(Issue(WARN, "", f"leads.csv has unexpected columns: {extra}"))
    return issues


def check_lead(row: dict[str, str], sup_emails, sup_domains, sup_reasons) -> list[Issue]:
    lead_id = (row.get("lead_id") or "").strip() or "(no lead_id)"
    issues: list[Issue] = []

    def block(msg): issues.append(Issue(BLOCK, lead_id, msg))
    def warn(msg): issues.append(Issue(WARN, lead_id, msg))

    email = normalise_email(row.get("email", ""))
    email_type = (row.get("email_type") or "").strip().lower()
    domain = registrable_domain(row.get("website", "")) or (
        email.split("@", 1)[1] if "@" in email else "")

    # Required evidence trail
    for field in ("business_name", "source_url", "date_collected",
                  "relevance_justification"):
        if not (row.get(field) or "").strip():
            block(f"{field} is empty — required for the compliance record")

    # Contactability
    if not email and email_type != "contact_form_only":
        block("no email address and not marked contact_form_only")
    if email and "@" not in email:
        block(f"email is malformed: {row.get('email')!r}")
    if email_type == "unverified" or (
            email and not (row.get("verification_date") or "").strip()):
        block("email not verified — never email an unverified address")
    if (row.get("verification_status") or "").strip().lower() not in {
            "verified", "contact_form_only"}:
        block(f"verification_status is {row.get('verification_status')!r}, "
              "expected 'verified'")

    # PECR: sole traders need consent, so they are out.
    corporate = (row.get("corporate_status") or "").strip().lower()
    if corporate == "sole_trader":
        block("sole trader / individual subscriber — PECR requires prior consent")
    elif corporate not in {"corporate", "unknown"}:
        block(f"corporate_status is {corporate!r}, expected corporate/sole_trader/unknown")
    elif corporate == "unknown":
        warn("corporate status unknown — owner review before drafting")

    # Free webmail
    if email and email.split("@", 1)[1] in FREE_WEBMAIL:
        block("free webmail address — not usable for cold B2B outreach "
              "unless published as the business enquiry address (then owner review)")

    # Suppression
    if email and email in sup_emails:
        block(f"on suppression list ({sup_reasons.get(email)}) — must never be emailed")
    if domain and domain in sup_domains:
        block(f"domain {domain} on suppression list "
              f"({sup_reasons.get(domain)}) — must never be emailed")
    if (row.get("opt_out_status") or "").strip().lower() in {"yes", "true", "opted_out"}:
        block("opted out — must never be emailed")

    # Scoring consistency
    components = {}
    for key in ("relevance", "decision_maker", "purchasing", "contact_quality",
                "engagement"):
        raw = (row.get(f"score_{key}") or "").strip()
        components[key] = raw if raw else None
    if all(v is None for v in components.values()):
        block("not scored")
    else:
        try:
            total, category, warnings = score(**components)
        except ValueError as exc:
            block(f"scoring error: {exc}")
        else:
            for w in warnings:
                warn(f"scoring: {w}")
            stated = (row.get("lead_score") or "").strip()
            if stated and stated.isdigit() and int(stated) != total:
                block(f"lead_score says {stated} but components total {total}")
            stated_cat = (row.get("lead_category") or "").strip().lower()
            if stated_cat and stated_cat != category:
                block(f"lead_category says {stated_cat!r} but score {total} "
                      f"is {category!r}")
            if category == "do_not_email_without_review" and (
                    row.get("approval_status") or "").strip().lower() != "owner_approved":
                block(f"score {total} is below 50 — needs explicit owner approval")

    # Campaign + lawful basis
    campaign = (row.get("recommended_campaign") or "").strip().upper()
    if campaign not in VALID_CAMPAIGNS:
        block(f"recommended_campaign is {campaign!r}, expected one of "
              f"{sorted(VALID_CAMPAIGNS)}")
    if (row.get("lawful_basis_status") or "").strip().lower() != "legitimate_interests":
        block("lawful_basis_status must be 'legitimate_interests'")
    if email_type == "named_corporate" and (
            row.get("approval_status") or "").strip().lower() != "owner_approved":
        warn("named corporate mailbox — flagged for compliance review before outreach")

    # Follow-up ceiling
    if (row.get("followup_2_date") or "").strip() and not (
            row.get("reply_status") or "").strip():
        warn("follow-up 2 already sent — sequence complete, do not contact again")

    return issues


def check_duplicates(rows: list[dict[str, str]]) -> list[Issue]:
    keys = {
        "email": lambda r: normalise_email(r.get("email", "")),
        "website domain": lambda r: registrable_domain(r.get("website", "")),
        "phone": lambda r: normalise_phone(r.get("phone", "")),
        "name+postcode": lambda r: (
            normalise_name(r.get("business_name", ""))
            + normalise_name(r.get("postcode", ""))),
        "linkedin": lambda r: (r.get("linkedin_url") or "").strip().lower(),
        "google business": lambda r: (r.get("google_business_url") or "").strip().lower(),
    }
    issues = []
    for label, fn in keys.items():
        seen = defaultdict(list)
        for row in rows:
            value = fn(row)
            if value:
                seen[value].append((row.get("lead_id") or "?").strip())
        for value, ids in seen.items():
            if len(ids) > 1:
                issues.append(Issue(BLOCK, ", ".join(ids),
                                    f"duplicate {label} '{value}' — deduplicate "
                                    "before drafting"))
    return issues


def check_templates() -> list[Issue]:
    """Every {{placeholder}} in the templates must be resolvable before sending."""
    issues: list[Issue] = []
    values: dict[str, str] = {}
    if SENDER.exists():
        try:
            values = json.loads(SENDER.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            return [Issue(BLOCK, "sender.json", f"invalid JSON: {exc}")]
    else:
        issues.append(Issue(BLOCK, "sender.json",
                            "config/sender.json not found — copy "
                            "sender.json.example and fill it in"))

    # Placeholders filled per-lead from leads.csv rather than from sender.json.
    per_lead = {
        "business_name", "greeting", "town", "verified_service_descriptor",
        "verified_site_count",
    }

    found: set[str] = set()
    for path in TEMPLATE_FILES:
        if path.exists():
            found |= set(re.findall(r"\{\{([A-Za-z0-9_]+)\}\}",
                                    path.read_text(encoding="utf-8")))

    for name in sorted(found - per_lead):
        if not str(values.get(name, "")).strip():
            issues.append(Issue(BLOCK, "template",
                                f"{{{{{name}}}}} is unset in config/sender.json — "
                                "sending is blocked until the owner supplies it"))
    return issues


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check-templates", action="store_true",
                    help="also verify every template placeholder is resolvable")
    ap.add_argument("--quiet", action="store_true", help="only print blocking issues")
    args = ap.parse_args()

    header, rows = read_csv(LEADS)
    sup_emails, sup_domains, sup_reasons = load_suppression()

    issues = check_schema(header)
    for row in rows:
        issues += check_lead(row, sup_emails, sup_domains, sup_reasons)
    issues += check_duplicates(rows)
    if args.check_templates:
        issues += check_templates()

    blocking = [i for i in issues if i.severity == BLOCK]
    warnings = [i for i in issues if i.severity == WARN]

    for issue in blocking:
        print(issue)
    if not args.quiet:
        for issue in warnings:
            print(issue)

    print(f"\n{len(rows)} lead(s) checked · {len(blocking)} blocking · "
          f"{len(warnings)} warning(s) · "
          f"{len(sup_emails)} suppressed address(es), {len(sup_domains)} domain(s)")

    if blocking:
        print("RESULT: BLOCKED — do not draft or send until resolved.")
        return 1
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
