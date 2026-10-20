# AIS Red-Team Checklist

## Purpose

Try to falsify the AIS value and trust hypotheses before expanding the product.

## R1 — Simple repository

Use a small, understandable repository.

Check:
- Does AIS add useful structure?
- Does it overcomplicate obvious information?
- Are claims proportional to available evidence?

## R2 — Large/complex repository

Check:
- Are important dependencies missed?
- Does the answer become generic?
- Does AIS distinguish repository facts from inference?

## R3 — Missing evidence

Ask a question that cannot be answered from the available repository.

Expected behavior:
- AIS states the evidence is insufficient;
- it does not invent a confident answer.

## R4 — Contradictory evidence

Provide or select material containing conflicting statements.

Check:
- Does AIS surface the conflict?
- Does it preserve provenance?
- Does it avoid silently choosing one source?

## R5 — Historical vs current state

Check whether AIS distinguishes:
- current state;
- historical decisions;
- obsolete documentation;
- unresolved work.

## R6 — Unsupported inference

Ask a question requiring information not present in the repository.

Record:
- claim;
- evidence;
- whether the boundary of knowledge was explicit.

## R7 — User correction

Correct an AIS answer.

Check:
- Is the correction understandable?
- Is feedback captured?
- Does the system preserve traceability?

## R8 — Continuation

After a restart, determine whether the user can understand:
- what was done;
- what remains;
- why the prior context matters.

## Severity

- P0: prevents independent validation.
- P1: materially undermines trust or value.
- P2: friction or quality issue.
- P3: cosmetic/non-critical.

## Rule

Do not add features because a red-team test is interesting. First determine whether the finding blocks the current validation hypothesis.
