# AIS External Validation Release Candidate Criteria

## Purpose

Define the minimum bar for tagging a version as an externally testable AIS MVP candidate.

## Required

### Repository

- public repository is reachable;
- AIS is clearly the first-user path;
- AIS/SIP boundary is documented.

### Engineering

- `npm ci` succeeds;
- `npm run build` succeeds;
- `npm test` succeeds;
- `npm run test:mvp-ui` succeeds;
- CI is green on the candidate commit.

### Launch

An independent machine has completed:

`clone -> install -> build -> start -> UI`

### Product smoke test

At minimum:
- Demo opens;
- an architecture question can be submitted when inference is configured;
- claims/evidence are inspectable;
- public GitHub repository import path is testable.

### Known limitations

The candidate must document:
- real inference/provider requirements;
- environment dependencies;
- unsupported repository cases;
- known quality limitations.

## Not required for v0.1 validation candidate

- production deployment;
- enterprise authentication;
- full observability;
- broad integrations;
- complete GitHub feature coverage;
- PMF evidence.

## Decision

- **READY** — all required gates pass.
- **READY WITH CONDITIONS** — only explicitly documented non-blocking limitations remain.
- **NOT READY** — any required gate is missing or failed.

A release candidate is a versioning marker, not evidence of market success.
