# AIS Repository Governance

## Purpose

This document defines how the repository is changed, verified, and released. It is an engineering control plane, not an architecture specification.

## 1. Source of truth

- `main` is the integration branch.
- A Pull Request is the review boundary.
- A commit is an immutable historical checkpoint.
- Tags/releases identify externally testable versions.
- Documentation must not claim evidence stronger than the underlying verification.

## 2. Change lifecycle

```text
Issue / task
  -> branch
  -> atomic commit(s)
  -> push
  -> Pull Request
  -> automated checks
  -> review
  -> merge
  -> main
  -> external validation
  -> release/tag when warranted
```

## 3. Evidence hierarchy

```text
E0 hypothesis/spec
E1 external problem signal
E2 concrete use case
E3 AIS validation on real use case
E4 user feedback
E5 repeatable scenario/pilot
```

CI evidence is engineering evidence. It does not substitute for E1–E5 user evidence.

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
- reproducible setup instructions;
- build/test evidence;
- known limitations;
- a defined validation scenario.

A release is not evidence of product-market fit.

## 7. Third-party machine gate

For a clean external machine:

```text
clone -> install -> build -> start -> open UI
      -> Demo -> evidence -> GitHub repo
      -> question -> feedback -> restart -> continuity
```

Failures in prerequisites/launch are tracked separately from product-value failures.

## 8. Current repository risks

- npm dependency installation is not lockfile-reproducible yet; `bun.lock` exists, but the documented workflow uses npm.
- CI is newly introduced and must be observed on GitHub before being treated as a trusted gate.
- Branch protection is not established by this document and should be configured in repository settings.
- AIS real-inference and user-validation evidence remain environment-dependent.

## 9. Operating rule

Do not solve a future governance problem by adding architecture. Keep repository controls minimal, explicit, and auditable.
