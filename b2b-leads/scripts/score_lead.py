#!/usr/bin/env python3
"""Lead scoring for the Hospitrade B2B pipeline.

The five components come from human/agent judgement and are stored as columns in
data/leads.csv. This module's job is to enforce the caps, recompute the total so a
hand-edited `lead_score` can never silently disagree with its parts, and map the
total onto a category.
"""

from __future__ import annotations

import argparse
import sys

# component -> maximum points
CAPS = {
    "relevance": 30,
    "decision_maker": 20,
    "purchasing": 20,
    "contact_quality": 15,
    "engagement": 15,
}

TOTAL_MAX = sum(CAPS.values())  # 100

# Guidance for whoever fills the components in. Not enforced — the caps are.
RUBRIC = {
    "relevance": (
        "dental practice/clinic up to 20; group, laboratory or distributor up to 20; "
        "clear need for dental consumables up to 10; capped at 30"
    ),
    "decision_maker": (
        "owner/principal dentist/director 20; practice or procurement manager 18; "
        "senior dental nurse or operations manager 14; generic reception only 8"
    ),
    "purchasing": (
        "multiple locations up to 20; implant/surgical/specialist up to 15; "
        "independent general practice up to 12; very small or unclear up to 6"
    ),
    "contact_quality": (
        "verified corporate email 15; generic public business email 12; "
        "contact form only 7; unverified email 0"
    ),
    "engagement": (
        "clear recurring-supply opportunity 15; bulk purchasing 12; "
        "possible product trial 8; weak or unclear fit 3"
    ),
}


def categorise(total: int) -> str:
    if total >= 80:
        return "hot"
    if total >= 65:
        return "strong"
    if total >= 50:
        return "nurture"
    return "do_not_email_without_review"


def score(**components: float) -> tuple[int, str, list[str]]:
    """Return (total, category, warnings).

    Unknown components raise. Missing components are treated as 0 and warned about,
    because a silently-absent component is how a lead ends up looking weaker or
    stronger than it is.
    """
    unknown = set(components) - set(CAPS)
    if unknown:
        raise ValueError(f"unknown score components: {sorted(unknown)}")

    warnings: list[str] = []
    total = 0
    for name, cap in CAPS.items():
        raw = components.get(name)
        if raw is None:
            warnings.append(f"{name} missing, treated as 0")
            raw = 0
        try:
            value = float(raw)
        except (TypeError, ValueError):
            raise ValueError(f"{name} is not numeric: {raw!r}")
        if value < 0:
            raise ValueError(f"{name} is negative: {value}")
        if value > cap:
            warnings.append(f"{name} {value:g} exceeds cap {cap}, clamped")
            value = cap
        total += value

    total_int = int(round(total))
    return total_int, categorise(total_int), warnings


def contact_quality_from_email_type(email_type: str) -> int:
    """The one component that is objectively determined by the data we hold."""
    return {
        "verified_corporate": 15,
        "generic_business": 12,
        "contact_form_only": 7,
        "unverified": 0,
    }.get((email_type or "").strip().lower(), 0)


def main() -> int:
    p = argparse.ArgumentParser(description="Score a single lead.")
    for name, cap in CAPS.items():
        p.add_argument(f"--{name.replace('_', '-')}", type=float, default=None,
                       help=f"0-{cap}: {RUBRIC[name]}")
    p.add_argument("--rubric", action="store_true", help="print the rubric and exit")
    args = p.parse_args()

    if args.rubric:
        for name, cap in CAPS.items():
            print(f"{name} (max {cap}): {RUBRIC[name]}")
        return 0

    supplied = {name: getattr(args, name) for name in CAPS}
    if all(v is None for v in supplied.values()):
        p.error("give at least one component, or --rubric")

    try:
        total, category, warnings = score(**supplied)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    print(f"score={total}/{TOTAL_MAX} category={category}")
    if category == "do_not_email_without_review":
        print("gate: below 50 — owner review required before any draft", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
