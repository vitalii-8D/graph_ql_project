---
title: <name> — impact summary
version: 1.0.0
updated: <YYYY-MM-DD>
inputs:
  - <design.md@x.y.z | path/to/NNN_dfa_<feature>.md@sha256:<12 chars>>
  - feature/<name>@<short-sha>
---

# <Name> — impact summary

Planned impact = the DFA's *Impact summary* (or `design.md`); this file is the **actual** impact. Built from the final diff `<base>...feature/<name>` (<n> files, +<a>/−<d>).

## Impacted modules

| Module | Change | AC |
|---|---|---|
| | | |

## Contract changes

| Kind | Name | Added / changed / removed | Breaking? |
|---|---|---|---|
| | | | |

## Database

| Migration | Effect | Reversible |
|---|---|---|
| | | |

## Configuration

| Env var | Required | Notes |
|---|---|---|

## Breaking changes

none | <list, with what a consumer must do>

## What to regress manually

No automated tests were written for this task. Check these flows by hand:

1. <flow — how to trigger it (query/mutation/request), expected result>
2. <failure path — expected error>

## Deviations from design

Result of the design-conformance check (DFA or `design.md` vs the final diff).

| Planned (design) | Built (diff) | Why | Resolution |
|---|---|---|---|
| none | | | |

Resolution: `design updated` / `code changed` / `accepted — documented here`.
