---
title: <name> — implementation checklist
version: 1.0.0
updated: <YYYY-MM-DD>
task: <name>
branch: feature/<name>
base: <base-branch>@<short-sha>
inputs:
  - prompt@<YYYY-MM-DD>
  - <path/to/input.md>@sha256:<12 chars>
---

## Task description

> <the user's task description, quoted verbatim>

## Inputs

| File | Location | Pin |
|---|---|---|
| PENDING — Step 1c not yet run | | |

## Context loaded

PENDING — Step 2 not yet run

<!-- Filled in Step 2/3, e.g.
| Item | Status / detail |
|---|---|
| House rules | CLAUDE.md, package.json scripts, ESLint / Prettier config |
| Stack | <framework + version> · <ORM / DB> · <API style> · <test runner> |
| Precedents | <path to a module wired the same way>, <path to a similar protected endpoint / component> |
| Cross-cutting | <search index, seeder, registration list, generated files, CLAUDE.md> |
| Best-practice rules | <skill / rule names loaded in Step 3> |
-->

## Decisions & clarifications

PENDING — Step 2 not yet run

<!-- - <YYYY-MM-DD> — Q: <question> → A: <user's answer>
     - <YYYY-MM-DD> — design@1.1.0 approved -->

## Acceptance criteria

PENDING — Step 2 not yet run

<!-- - [ ] AC1 — "<verbatim from input>"   (or mark the section `DERIVED — confirm` until Step 4 approval) -->

## Assumptions

PENDING

## Steps

- [ ] Step 1 — name, branch, inputs registered, checklist opened
- [ ] Step 2 — context gathered, ACs extracted, clarifications asked
- [ ] Step 3 — stack best practices + house rules loaded
- [ ] Step 4 — design approved (existing DFA reused, or design.md written)
- [ ] Step 5 — plan expanded below
- [ ] Step 6 — implementation (expanded in Step 5)
- [ ] Step 7 — validation green (incl. design conformance)
- [ ] Step 8 — impact_summary.md + fe_handoff.md (client handoff) written
- [ ] Step 9 — hand-back

## Validation

| Check | Result |
|---|---|
| Lint | PENDING |
| Build / types | PENDING |
| Migration consistency | PENDING |
| App boots | PENDING |
| Acceptance cross-check | PENDING |
| Best-practices self-review | PENDING |
| Cross-cutting sync | PENDING |
| Design conformance (vs DFA / design.md) | PENDING |

## Follow-ups

none yet
