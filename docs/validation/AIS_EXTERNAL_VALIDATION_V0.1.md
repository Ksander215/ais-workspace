# AIS External Validation v0.1

## Purpose

This package defines the minimum protocol for the first independent external validation of the AIS MVP.

It separates:
- technical launch evidence;
- product/value evidence;
- user feedback;
- continuation/design-partner evidence.

It does not certify production readiness or product-market fit.

## Current validation question

> Can a technically competent user independently launch AIS, understand what it is for, use it on a codebase, judge the quality and evidence of its answers, and identify a concrete reason to continue?

## Evidence ladder

| Level | Meaning | Example |
|---|---|---|
| E0 | Hypothesis/specification | AIS should reduce context reconstruction |
| E1 | External problem signal | User confirms the problem exists |
| E2 | Concrete use case | User provides a real task/context |
| E3 | AIS validation | AIS is used on that use case |
| E4 | User feedback | User evaluates value, errors, trust |
| E5 | Repeatable scenario/pilot | User wants to continue |

Technical CI results are engineering evidence and do not replace E1–E5.

## Validation package

1. [Independent Tester Protocol](./INDEPENDENT_TESTER_PROTOCOL.md)
2. [Red-Team Checklist](./AIS_RED_TEAM_CHECKLIST.md)
3. [Design Partner Sprint #1](./DESIGN_PARTNER_VALIDATION_SPRINT_1.md)
4. [Value Metrics](./AIS_VALUE_METRICS.md)
5. [Release Candidate Criteria](./AIS_RELEASE_CANDIDATE_CRITERIA.md)

## Rules

- Do not coach the tester toward expected answers.
- Record failures exactly as observed.
- Separate launch defects from product-value defects.
- Treat silence as no evidence.
- Do not convert a successful demo into a claim of product value.
- Do not change architecture during a validation session unless a verified defect requires it.
- Prefer the smallest change that closes the observed bottleneck.

## Success condition for this cycle

The cycle is successful when we have a reproducible independent launch result plus a clear decision:

- **GO** — proceed to a real use case / Design Partner;
- **FIX** — resolve a blocking technical/product defect and repeat;
- **PIVOT** — evidence contradicts the current value hypothesis.

