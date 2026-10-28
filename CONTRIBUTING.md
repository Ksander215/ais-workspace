# Contributing to AIS

This repository contains **AIS — Autonomous Intelligent System** only. The former **SIP — Security Intelligence Platform** contour was removed from `main`; the commercial product built on it lives in a separate repository.

## Before changing code

1. Read the root README and make sure the change belongs to AIS.
2. Read the relevant current-state/architecture documentation under `docs/`.
3. Find or create a GitHub Issue for non-trivial work.
4. Do not expand architecture unless the task has an explicit architectural reason.
5. Separate facts, hypotheses, assumptions, and validation results in task documentation.

## Branching

Use one branch per change:

```text
feature/<task>-<short-description>
fix/<task>-<short-description>
docs/<task>-<short-description>
test/<task>-<short-description>
chore/<task>-<short-description>
```

Do not develop directly on `main` for substantive changes.
