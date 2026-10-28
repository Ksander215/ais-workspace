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

## Commits

Keep commits atomic: one coherent change per commit. Use Conventional Commit style:

```text
feat(scope): short description
fix(scope): short description
docs(scope): short description
test(scope): short description
chore(scope): short description
refactor(scope): short description
```

Reference the Issue when appropriate. Keep the subject concise and explain **why** in the body when the reason is not obvious.

## Pull Requests

Every substantive change enters `main` through a Pull Request.

A PR should state:
- problem and reason;
- scope and explicit non-goals;
- files/components affected;
- validation performed;
- known limitations;
- evidence status (E0–E5 where relevant).

Never claim a check was run unless it was actually run.

## Required local checks

For AIS runtime changes, run:

```bash
npm install
npm run build
npm test
```

For MVP UI changes, additionally run:

```bash
npm run test:mvp-ui
```

For user-facing launch changes, perform the Third-PC Launch Gate when a clean external machine is available.

## Review policy

Reviewers check:
- correctness and scope;
- regressions;
- security and secret handling;
- tests/evidence;
- documentation;
- architectural impact.

A PR is not accepted merely because tests pass. Runtime and user-validation evidence remain separate.

## Evidence discipline

Use these evidence levels consistently:

- **E0** — internal hypothesis/specification.
- **E1** — external signal that the problem exists.
- **E2** — concrete real use case.
- **E3** — AIS validated on the real use case.
- **E4** — user feedback after validation.
- **E5** — repeatable scenario/pilot.

Synthetic tests do not count as external user evidence.

## Scope rule

Prefer the smallest change that closes the current bottleneck. Defer architecture, features, and polish that do not affect the critical path.
