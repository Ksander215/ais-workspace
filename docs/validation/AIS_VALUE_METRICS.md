# AIS Value Metrics

## Purpose

Measure whether AIS creates value rather than merely producing technically valid output.

## Primary metrics

### M1 — Time to Understanding

Time from first access to a usable mental model of the target system.

Record:
- baseline without AIS;
- time with AIS;
- task definition.

### M2 — Context Reconstruction Effort

Count significant manual actions needed to locate and connect relevant context.

### M3 — Evidence Coverage

For sampled AIS claims:

`Evidence Coverage = supported claims / sampled claims`

Record unsupported or weakly supported claims separately.

### M4 — Correction Rate

`Correction Rate = user-corrected claims / sampled claims`

Lower is better, but correctness and claim importance matter more than the raw percentage.

### M5 — Trust

Ask the user to classify output:
- trusted;
- trusted with verification;
- not trusted.

Also capture why.

### M6 — Continuation

Did the user voluntarily request another AIS session?

This is a high-value qualitative signal.

## Comparison baseline

Where practical, compare:

A. manual investigation;
B. generic LLM-assisted investigation;
C. AIS-assisted investigation.

Keep the task and repository/context comparable.

## Measurement rule

Do not optimize a metric before establishing that the metric correlates with user value.
