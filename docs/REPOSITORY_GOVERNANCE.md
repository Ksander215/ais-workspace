# Repository Governance

This document defines the governance rules for the AIS repository: how changes are made, what evidence is required, and what a release candidate must satisfy.\n
## 1. Scope

This repository contains AIS only. The former SIP contour was removed from `main`; the commercial product built on it lives in a separate repository.

## 2. Evidence levels

| Level | Meaning |
|---|---|
| E0 | Specification or design intent |
| E1 | External signal (market, user, operational) |
| E2 | Use case exercised end to end |
| E3 | AIS validation of the use case |
| E4 | Feedback collected from a real user |
| E5 | Pilot in a real setting |

CI evidence is engineering evidence. It does not substitute for E1–E5 user evidence.

## 3. Validation corpus

External validation runs on a frozen corpus of real open-source repositories. The corpus composition is fixed before the run and is not changed because results are inconvenient.

## 4. AIS / SIP boundary

AIS is the only product in this repository and the active validation target. The former SIP contour was removed from `main` so that it cannot affect AIS runtime, tests, discovery or CI; the commercial product built on it lives in a separate repository. Historical validation records that mention SIP are kept as evidence of past runs and describe a contour that no longer exists here.

## 5. Merge gate

Before merging a substantive AIS change:
- PR scope is explicit;
- automated build/test checks are green when applicable;
- review findings are resolved;
- no secret or credential is introduced;
- documentation and evidence claims are accurate.

## 6. Release gate

A release candidate should have:
- a known commit SHA;
