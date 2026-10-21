# AIS Technical Validation Ground — Polygon Protocol

## Purpose

The Polygon is a controlled pre-human-validation experiment. It attacks the current AIS baseline with real public codebases and records where the system fails, becomes uncertain, or produces unsupported conclusions.

It is not a benchmark of raw LLM intelligence and not a substitute for human validation.

## Corpus

Initial corpus:

| ID | Profile | Repository |
|---|---|---|
| P1 | AI/agent/plugin-oriented | DeepSeek Harness |
| P2 | large agent/developer platform | OpenHands |
| P3 | stateful agent/memory platform | Letta |
| P4 | memory infrastructure | Mem0 |
| P5 | large non-agent contrast case | To be selected before execution |

The corpus is frozen before the first measurement run.

## Controlled question set

Run these questions where the repository supports them:

1. What is the overall architecture of this project?
2. What are the main modules and their responsibilities?
3. What are the most important dependencies between modules?
4. Where is execution/workflow orchestrated?
5. Which claims in the answer are directly supported by repository evidence?
6. What information is missing or ambiguous?
7. What appears current versus historical?

Additional questions are allowed only when they test a documented hypothesis.

## Procedure

For each repository:

1. Record repository URL, default branch, commit SHA and date.
2. Import it through the AIS MVP path.
3. Run the controlled questions.
4. Capture AIS claims and evidence.
5. Independently verify sampled claims against the repository.
6. Record failures and uncertainties.
7. Repeat any P0/P1 finding once to test reproducibility.
8. Do not modify AIS between runs unless the experiment explicitly enters a fix cycle.

## Evaluation dimensions

- architecture reconstruction
- module/dependency understanding
- execution/workflow relationships
- evidence/provenance
- unsupported inference handling
- contradictory/stale information
- scale/complexity
- continuity where supported

## Decision rule

A finding becomes an engineering candidate only when:
- it is reproducible or materially severe;
- the expected behavior is clearly defined;
- the finding affects the current AIS hypothesis or validation path.

Then choose:

- BUILD
- DEFER
- REJECT

No new architecture is introduced solely because a test produced an interesting failure.

## Experiment phases

### Phase A — Observe

Run the frozen baseline without fixes.

### Phase B — Measure

Record outputs, evidence, errors and verification results.

### Phase C — Diagnose

Classify findings and determine whether they are runtime, evidence, UX, context, or architecture issues.

### Phase D — Decide

Prioritize P0/P1 findings and decide BUILD/DEFER/REJECT.

### Phase E — Fix

Only after the decision gate, implement the smallest justified change.

### Phase F — Re-run

Repeat affected experiments and compare against the baseline.

## Exit gate

Polygon is complete when:
- all frozen corpus entries have runs;
- evidence ledger is complete;
- repeated failures are distinguished from one-offs;
- gap matrix is produced;
- P0/P1 findings have decisions;
- readiness for independent human validation is explicitly decided.
