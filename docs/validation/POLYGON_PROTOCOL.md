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


## Frozen Corpus — Polygon #1

The corpus for Polygon #1 is frozen as follows:

| ID | Project | GitHub repository | Why selected |
|---|---|---|---|
| P1 | DeepSeek Harness | https://github.com/deepseek-ai/deepseek-harness | AI/agent/plugin-oriented structure; tests AIS on agent-oriented relationships |
| P2 | OpenHands | https://github.com/OpenHands/OpenHands | Large developer-agent platform; tests scale, modularity and orchestration |
| P3 | Letta | https://github.com/letta-ai/letta | Stateful agents/memory; tests state, context and execution relationships |
| P4 | Mem0 | https://github.com/mem0ai/mem0 | Memory infrastructure; tests context/memory boundaries and evidence |
| P5 | Kubernetes | https://github.com/kubernetes/kubernetes | Large non-agent contrast case; tests scale and complex dependency/architecture reconstruction |

### Freeze rule

Do not replace a corpus member because AIS performs poorly on it. Replacement requires a documented reason such as repository unavailable, licensing/access constraint, or failure to represent the intended profile.

## Controlled experiment set

### E0 — Repository orientation

Q1: What is the overall architecture of this project?

Expected observation: AIS should identify major architectural areas without inventing components.

### E1 — Module responsibilities

Q2: What are the main modules and what does each one do?

Expected observation: responsibilities should be traceable to repository evidence.

### E2 — Relationships

Q3: What are the most important dependencies between modules?

Expected observation: relationships should be supported by imports, configuration, calls, or other repository evidence where available.

### E3 — Execution/workflow

Q4: Where is execution or workflow orchestrated?

Expected observation: AIS should identify actual orchestration points and distinguish them from supporting code.

### E4 — Evidence boundary

Q5: Which parts of your answer are directly supported by repository evidence, and which are inference?

Expected observation: AIS should expose uncertainty instead of presenting inference as fact.

### E5 — Missing information

Q6: What cannot be determined reliably from this repository alone?

Expected observation: explicit unknowns and missing evidence.

### E6 — Current vs historical

Q7: What appears current, and what may be historical or stale?

Expected observation: no unsupported certainty when repository history/docs are insufficient.

## Per-project execution record

For every P1–P5, capture Q1–Q7 with the same procedure. Record the AIS commit SHA and target repository commit SHA. Sample and independently verify material claims.

### Reproducibility rule

A P0/P1 finding must be repeated once before being treated as a confirmed engineering gap, unless the finding itself prevents the validation path from continuing.

### Cross-project rule

A repeated failure across two or more materially different projects is a stronger candidate for a systemic AIS gap than a failure isolated to one repository.
