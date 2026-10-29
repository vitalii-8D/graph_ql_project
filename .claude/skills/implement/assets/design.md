---
title: <name> — design
version: 1.0.0
updated: <YYYY-MM-DD>
status: draft | approved
inputs:
  - prompt@<YYYY-MM-DD>
  - <path/to/input.md>@sha256:<12 chars>
---

# <Name> — design

## 1. Summary

<3–5 lines: what is being built and why.>

## 2. Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | "<verbatim>" | <input file / prompt / DERIVED> |

## 3. Modules & files

| Module | File | Layer | Change | AC |
|---|---|---|---|---|
| <module> (new) | <path/to/file> | <service / component / route / …> | create | AC1, AC2 |

## 4. Data model

**Entities / models / columns / relations / indexes / enums** (n/a for tasks with no persistence)

| Entity (table) | Change | Detail |
|---|---|---|
| | | |

**Migrations:** <names, what each does, reversible? data backfill?>

## 5. Contract

### GraphQL

| Operation | Kind | Auth / roles | Input | Output | Errors |
|---|---|---|---|---|---|
| | query / mutation / subscription | | | | |

### REST

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|

### WebSocket / webhooks / events

| Name | Direction | Payload | Notes |
|---|---|---|---|

### Environment variables

| Var | Required | Purpose | Example |
|---|---|---|---|

## 6. Flows

<Numbered steps or a Mermaid sequence/state diagram for every non-trivial flow: state transitions, async confirmations, retries, failure paths.>

## 7. Cross-cutting sync

- [ ] <search index / cache / event consumers>
- [ ] <seeder>
- [ ] <registration list / wiring (entities, routes, providers)>
- [ ] <generated schema / client regenerated>
- [ ] <CLAUDE.md / README section>
- [ ] <.env.example>

## 8. Best practices applied / overridden

| Rule | How it shapes this design |
|---|---|
| <rule name from the loaded best-practices skill / CLAUDE.md> | |

**House-rule overrides:** <generic rule → repo convention that wins, and why>

## 9. Risks & open questions

- <risk / question — owner>

## 10. Assumptions

- <decision made where inputs were silent — needs confirmation at the gate>
