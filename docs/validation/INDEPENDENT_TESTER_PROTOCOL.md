# AIS Independent Tester Protocol

## Objective

Observe whether a technically competent person can use the public repository without guided setup.

The tester should receive only the repository URL and this protocol.

## Test environment

Record:

- OS:
- Node.js:
- npm:
- Git:
- machine type:
- network restrictions:
- AIS commit SHA:

## Procedure

### A. Launch

1. Open the repository.
2. Clone it.
3. Enter the repository root.
4. Run `npm ci`.
5. Run `npm run build`.
6. Run `npm run mvp-ui`.
7. Open `http://localhost:3456`.

Record:
- time to successful launch;
- errors;
- commands that were unclear;
- any manual workaround.

### B. First-use comprehension

Without additional explanation, record:

1. What do you think AIS does?
2. What would you use it for?
3. What is unclear?

### C. Demo

1. Open Demo.
2. Ask: `What is the overall architecture of this project?`
3. Inspect the answer.
4. Inspect claims/evidence.
5. Ask one architecture question of your choice.

Record:
- useful parts;
- incorrect/misleading parts;
- missing evidence;
- surprising behavior;
- trust level.

### D. External repository

Use **GitHub Repository** with a public repository.

Record:
- import success/failure;
- time to import;
- whether the result appears grounded in repository evidence;
- limitations.

### E. Continuity

1. Stop AIS.
2. Restart it.
3. Reopen the same project.
4. Inspect **Welcome Back** / continuity.

Record whether the state is understandable and useful.

## Tester report

### Result

- Launch: PASS / FAIL / BLOCKED
- Build: PASS / FAIL
- UI: PASS / FAIL
- Demo: PASS / FAIL
- External repo: PASS / FAIL / NOT TESTED
- Continuity: PASS / FAIL / NOT TESTED

### Critical observations

- What failed?
- What was confusing?
- What created value?
- What reduced trust?
- What would you change first?

### Continuation signal

Choose one:

- **No** — no reason to continue.
- **Maybe** — interesting, but insufficient value.
- **Yes, on another repository**.
- **Yes, on a real project/task**.

Add the tester's own words where possible.

## Interpretation rule

A technical launch PASS is not product validation. The strongest signal in this protocol is an unsolicited willingness to use AIS on a real task.
