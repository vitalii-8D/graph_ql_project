---
name: implement
description: 'Implement a feature in a NestJS project end to end from a task description plus manually provided input files (specs, notes, payload samples, screenshots) — no Jira, no external trackers. Triages first: a written spec / input files / multi-module, contract, schema, auth or money change takes the full track — asks for a task name, creates a feature branch, writes versioned artifacts under docs/tasks/<name>/ (implementation checklist, design doc, impact summary, FE handoff note), implements step by step against nestjs-best-practices with a commit per step, and validates with lint + build + acceptance cross-check; a small self-contained prompted change takes the fast track and skips the artifacts. Use when asked to "implement this", "build this feature", "work on this task", "/implement <description> [files…]", or when handed a spec file to build.'
argument-hint: '<task description> [input file paths…]'
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, TodoWrite, AskUserQuestion, Skill, Agent
version: 1.0.0
updated: 2026-10-07
---

# Implement a Task (NestJS)

Entry point for backend feature work in any NestJS project. The source of truth is **what the user handed you**: the task description in the prompt and the input files they named. Nothing else — no tracker, no wiki, no guessing from a plausible-looking file the user did not point at.

**Shape of a full-track run:** triage (0) → name, branch, open the checklist (1) → gather context (2) → load best practices (3) → design doc + approval gate (4) → expand the plan (5) → implement step by step, commit per step (6) → validate until green (7) → impact summary + FE handoff (8) → hand back (9).

**Shape of a fast-track run:** triage (0) → branch (1-fast) → house rules + relevant best practices (3) → change → lint + build → commit → report.

> **Testing is out of scope for this skill.** Do not write new tests and do not run the test suite as a gate. If the user explicitly asks for tests in a given run, that request wins for that run — say so in the checklist.

## Hard limits (both tracks)

- **Never push, never open a pull request, never deploy, never touch a remote server.** Commits stay local; a human pushes.
- **Never invent a business rule.** A missing decision (a price, a limit, a role, an error shape, a status transition) is a question for the user, not a `TODO` or an assumption buried in code.
- **Never hand-edit generated files** (e.g. a code-first GraphQL `schema.gql`, generated clients). Regenerate them by running the build/app.
- **Never report work as validated if Step 7 did not run green.** On the fast track, say plainly what you skipped.
- **[FULL TRACK] Never let the checklist fall behind the work.** A step you finished but did not tick is indistinguishable, at review time, from a step you did not do.

---

## Step 0 — Triage: full track or fast track

Decide before anything else.

### Full track — when **any** of these is true

| Trigger | Why |
|---|---|
| The user **provided input files** (spec, requirements, notes, samples) | There are requirements to verify against and artifacts to keep in sync |
| The description is a **multi-paragraph spec or lists acceptance criteria** | Same — there is something to cross-check |
| It touches **several modules**, or a module others depend on | Dependents break silently |
| It changes a **contract** — GraphQL schema, REST route, WebSocket event/payload, DB schema/migration, env vars, a shared provider's public interface | A consumer (FE, another service) builds against it |
| It touches **auth, authorization, payments/money, data deletion or migration** | Blast radius is not proportional to diff size |
| The user asks for **artifacts, a design doc, a review-ready branch** | They named the deliverable |

### Fast track — everything else

A small, self-contained, directly prompted change: one or a few files in one module, no contract change, nothing depending on it (a rename, a message/label, a config value, a small helper, a one-file bug fix).

| | Full track | Fast track |
|---|---|---|
| Step 1 — ask name, branch, checklist | required | branch only, name derived (`fix/<slug>` / `chore/<slug>`), no checklist |
| Step 2 — context gathering | required | read only the files you touch |
| Step 3 — house rules + `nestjs-best-practices` | required | required, narrowed to the touched files |
| Step 4 — design doc + approval gate | required | skip |
| Step 5 — plan | required | skip |
| Step 6 — implement, commit per step | required | one commit |
| Step 7 — validation | full | lint + build only |
| Step 8 — impact summary, FE handoff | required | skip |

**Escalate mid-run, without asking**, the moment the change reaches further than it looked (a second module, a migration, a contract change): say so and switch to the full track from that point — start at Step 1.

**When genuinely ambiguous, ask** one question: "quick change, or the full flow with artifacts?"

---

## Step 1 — Name the task, branch, open the checklist  **[FULL TRACK]**

This happens **first** — before reading the codebase in depth. The checklist must exist before most of what goes in it is known: it is the durable record of a run that gets interrupted.

### 1a. Ask for the task name — every time

Use `AskUserQuestion`. Offer 2–3 short kebab-case suggestions derived from the description (e.g. `stripe-post-payments`, `post-payments`); the user can type their own via "Other". The name must be kebab-case, `[a-z0-9-]`, ≤ 40 chars — normalise what the user typed and tell them if you changed it.

The task directory is `docs/tasks/<name>/`.

- **It already exists and contains `implementation_checklist.md`** → this is a **resume**, not a new run. Read the checklist, trust its ticked boxes, re-check anything `BLOCKED`/`PENDING`, check out its recorded branch, and continue from the first unticked step. Do not create a second checklist.
- **It exists without a checklist** → ask whether to reuse it or pick another name. Never overwrite files you did not create.

### 1b. Create the branch

1. `git status --porcelain` — if the tree is dirty with changes unrelated to this task, **stop and ask** (stash / commit / proceed on top). Never stash or discard the user's work on your own.
2. Branch off the **current** branch: `git switch -c feature/<name>` (use `fix/<name>` when the task is a bug fix). If the branch exists, ask before reusing it.
3. Record the base branch and its short SHA in the checklist frontmatter.

### 1c. Register the inputs

For every input file the user provided:

- Read it **in full** (images/PDFs too — the `Read` tool handles them).
- If it lives **outside the repo or in a gitignored path** (`git check-ignore -q <path>`), copy it to `docs/tasks/<name>/inputs/` so the task folder is self-contained and reviewable. Files already tracked in the repo are referenced by path, not copied.
- Pin each input as `<path>@sha256:<first 12 chars>` (`sha256sum <file> | cut -c1-12`). The task description itself is pinned as `prompt@<today>` and quoted verbatim in the checklist.

A file the user mentioned that you cannot find or read → **ask for the correct path**. Do not substitute a similarly named file.

### 1d. Write the checklist skeleton

Create `docs/tasks/<name>/implementation_checklist.md` from [`assets/implementation_checklist.md`](assets/implementation_checklist.md). Every section present, everything not yet known marked `PENDING`.

**Commit it** (see *Commit protocol*), then tick the Step 1 box.

### Update protocol — how the checklist stays current

Apply at every step boundary for the rest of the run:

- **Update after each unit of work, never in a batch at the end.** A unit: a step finished, an implementation step committed, a decision taken, a gap found.
- **Tick a box only when its own check passed** — the build is green, not "the code is written".
- **Replace `PENDING` with content**, never with silence.
- **When reality diverges from the plan, edit the checklist and say why** in a note under the step.
- **Mark blocked steps `BLOCKED — <what you are waiting for>`**; never tick to keep it tidy.
- **Bump `version` + `updated`**: MINOR when you add/change steps, ACs, inputs or fill a `PENDING` section; PATCH for notes and wording.
- Use `TodoWrite` as the in-session view; the file is the durable record. If they disagree, fix the file.

---

## Step 2 — Gather context  **[FULL TRACK]**

### 2a. Requirements

From the description and input files extract:

- **Acceptance criteria.** If the inputs list them, quote them **verbatim**. If they don't, derive a numbered list from the description, mark the section `DERIVED — confirm`, and get it confirmed at the Step 4 gate. Never silently invent one.
- **Explicit scope cuts** ("not in this task", "later") — record them; do not build them.
- **Constraints** — library versions, naming, endpoints, env vars, data retention, roles.
- **Contradictions** between inputs (or between an input and the description) → quote both and **ask** which wins. Don't pick one silently.

### 2b. House rules of *this* repo

Read, in this order, whichever exist:

1. `CLAUDE.md` (root and `.claude/CLAUDE.md`), `AGENTS.md`, `CONTRIBUTING.md`, `README.md` (treat a README as possibly stale when it contradicts code or CLAUDE.md).
2. `package.json` — **scripts** (these define lint/build/migrate commands; do not assume names), Nest version, ORM (TypeORM / Prisma / MikroORM / Mongoose), GraphQL vs REST vs both, validation stack, Node/npm engines.
3. `nest-cli.json`, `tsconfig.json` (strictness), ESLint + Prettier config.
4. Any per-project instruction directory the files above point to.

House rules **override** generic best practices where they conflict (e.g. a repo convention of per-domain `types.ts`/`enums.ts` beats a generic "one folder per kind" rule). Note every such override in the design doc.

### 2c. The code the task touches

- Locate the affected modules, entities, DTOs, services, resolvers/controllers, guards, config, migrations, seeders. Use `Explore` subagents for wide sweeps across many files; read directly when you know where to look.
- Find the **closest existing precedent** for each kind of thing you will build (a module wired the same way, an entity with a similar relation, a guarded mutation, a webhook route) — you will mirror it, not invent a new pattern.
- Note cross-cutting concerns the change must keep in sync: search indexes, caches, event emitters, seeders, the documentation in `CLAUDE.md`, an explicit entity list in the DB config, generated schema files.

### 2d. Gate on what is missing

- **No acceptance criteria and nothing to derive them from** → stop and ask.
- **A business decision the inputs don't make** (amounts, limits, role checks, status transitions, error behaviour) → collect them all and ask in **one** `AskUserQuestion` round (≤ 4 questions; batch the rest into the design doc's *Open questions*).
- **An optional detail is missing and the work is unblocked** → proceed, list it under *Assumptions* in the checklist.

### ✅ Update the checklist

Fill **Inputs**, **Context loaded** (house-rule files read, precedents found, cross-cutting concerns), **Decisions & clarifications** (each answer the user gave, dated), **Acceptance criteria** (verbatim or `DERIVED — confirm`). Tick Step 2, bump MINOR, commit.

---

## Step 3 — Load NestJS best practices  **[BOTH TRACKS]**

Invoke the **`nestjs-best-practices`** skill via the `Skill` tool. If it is not available in this project, read `~/.agents/skills/nestjs-best-practices/SKILL.md` and its `rules/` directly; if neither exists, tell the user once and continue with the house rules alone.

Don't read all ~40 rules. Pick the ones this task actually exercises and read those rule files in full:

| The task… | Read at least |
|---|---|
| adds a module / provider | `arch-feature-modules`, `arch-single-responsibility`, `arch-avoid-circular-deps`, `arch-module-sharing`, `di-prefer-constructor-injection` |
| wraps a third-party SDK (payments, storage, mail…) | `di-use-interfaces-tokens`, `test-mock-external-services` (for seam design, not tests), `error-handle-async-errors`, `devops-use-config-module` |
| adds inputs / endpoints / resolvers | `security-validate-all-input`, `api-use-dto-serialization`, `api-use-pipes`, `security-use-guards`, `security-sanitize-output` |
| changes entities / queries | `db-use-migrations`, `db-use-transactions`, `db-avoid-n-plus-one`, `perf-optimize-database` |
| touches auth | `security-auth-jwt`, `security-use-guards`, `security-rate-limiting` |
| has error paths | `error-throw-http-exceptions`, `error-use-exception-filters`, `error-handle-async-errors` |
| emits side effects across domains | `arch-use-events`, `micro-use-queues` |
| adds config / logging | `devops-use-config-module`, `devops-use-logging` |

**✅ [FULL TRACK]** Record the rules you loaded (by file name) in the checklist's *Context loaded*, tick Step 3.

---

## Step 4 — Design doc + approval gate  **[FULL TRACK]**

Still no production code. Write `docs/tasks/<name>/design.md` from [`assets/design.md`](assets/design.md) — a lightweight DFA: what changes, where, and the exact contract.

It must contain, filled for *this* task (write `n/a` with a reason rather than deleting a section):

1. **Summary** — 3–5 lines, what and why.
2. **Acceptance criteria** — the list from Step 2, each with an ID (`AC1`…).
3. **Modules & files** — every module touched or added, with the layer (entity / DTO / service / resolver / controller / gateway / guard / config / migration / seeder) and the AC it serves.
4. **Data model** — new/changed entities, columns, relations, indexes, enums; the migration(s) required.
5. **Contract** — every GraphQL query/mutation/subscription, REST route, WebSocket event, webhook, env var: name, auth/roles, input shape, output shape, errors. This section is what the FE handoff is generated from — be exact.
6. **Flows** — the non-trivial sequences (state transitions, async confirmations, retries), as a numbered list or a small Mermaid diagram.
7. **Cross-cutting sync** — indexes, caches, seeders, generated schema, `CLAUDE.md` sections that must be updated.
8. **Best practices applied / overridden** — rule → how it shapes the design; house-rule overrides with the reason.
9. **Risks & open questions.**
10. **Assumptions** — anything you decided where the inputs were silent (should be small after Step 2d).

### The gate

Commit the design doc, then present a **short** summary in chat (AC list, modules, contract headlines, open questions) and ask with `AskUserQuestion`: **Proceed / Change something / Stop**. Do not write production code before an explicit *Proceed*.

- *Change* → edit `design.md`, bump its version, re-ask.
- If, during implementation, the design proves wrong or unimplementable → stop, update `design.md` (bump version), say what changed and why, and re-confirm before continuing when the change touches the contract or an AC.

**✅** Tick Step 4 once approved; record the approval (date + "approved design@x.y.z") under *Decisions & clarifications*.

---

## Step 5 — Expand the checklist into an executable plan  **[FULL TRACK]**

Replace the placeholder Step 6 line with the real steps, in execution order. Each step is **one commit-sized unit**, names its files, its layer and the AC(s) it serves. Typical ordering for Nest:

1. enums / types / constants / config keys (+ `.env.example`, required-env validation)
2. entities + registration (module `forFeature`, any explicit entity list in the DB config)
3. migration (generated from entities, never hand-written schema unless the ORM can't generate it)
4. third-party wrapper / infra provider
5. domain service logic
6. DTOs + resolver / controller / gateway, guards, decorators
7. module wiring (`imports`/`providers`/`exports`), `AppModule`
8. cross-cutting sync (search index mapping, seeders, caches)
9. docs (`CLAUDE.md` / README section for the new domain)

**✅** Tick Step 5, bump MINOR, commit.

---

## Step 6 — Implement, step by step  **[FULL TRACK]**

For each plan step:

1. Implement it, **mirroring the precedent** you found in 2c (naming, file placement, decorators, error style, comment density) and the rules from Step 3.
2. Run the **cheap check** for the step: `npx tsc --noEmit -p tsconfig.json` (or the repo's build script) — fix before moving on. Don't let errors accumulate for Step 7.
3. Tick the step in the checklist (with a note if it diverged from the plan).
4. **Commit** the step's code *and* the checklist update together.

Rules while implementing:

- **Contract first, then logic.** If the design's contract turns out to need changing, update `design.md` first (Step 4 rule).
- **Secrets and config** go through the project's config mechanism; add new env vars to `.env.example` (never to `.env`) and to any required-env list.
- **Migrations** — generate them with the repo's script when a database is reachable; if it isn't, write the migration by hand to match the entity exactly and mark the checklist step `migration hand-written — not verified against a DB`.
- **Generated artifacts** (e.g. `schema.gql`) — regenerate by building/booting, never edit.
- **No scope creep.** Refactors you notice outside the task go into the checklist's *Follow-ups*, not into the diff.

---

## Step 7 — Validate until green  **[FULL TRACK — fast track runs 7a + 7b only]**

The moment you believe the work is done, run all checks. Collect every failure, fix, re-run until all pass. Never mark a check PASS that did not run — mark it `NOT RUN — <reason>`.

| # | Check | How |
|---|---|---|
| 7a | **Lint** | the repo's `lint` script (if it auto-fixes, commit the fixes) |
| 7b | **Build / types** | the repo's `build` script (falls back to `npx tsc --noEmit`) |
| 7c | **Migration consistency** | if entities changed and a DB is reachable: run pending migrations, then the migration-generate script in dry-run/check mode (or generate into a temp name and confirm it's empty, then delete it) — a non-empty diff means entity and migration disagree |
| 7d | **App boots** | when cheap: start the app (dev script) in the background, wait for the "listening"/"Nest application successfully started" log, then stop it. Confirms DI wiring and, for code-first GraphQL, regenerates the schema. Skip with a reason if it needs services that aren't running |
| 7e | **Acceptance cross-check** | for each AC: the file(s)/symbol(s) that satisfy it, or `NOT MET` + why. An AC you cannot point at code for is not met |
| 7f | **Best-practices self-review** | re-read the diff (`git diff <base>...HEAD`) against the Step 3 rules and the house rules: guards on every new mutation/route, DTO validation on every input, no secrets logged, transactions where multi-write consistency matters, no N+1 introduced, no circular imports, no business logic in resolvers/controllers |
| 7g | **Cross-cutting sync** | every item in design §7 actually done (seeders, indexes, `CLAUDE.md`, `.env.example`) |

Tests are not part of this gate (see the top of the file).

**✅** Record each check's result in the checklist's *Validation* table, tick Step 7 only when every row is PASS or a justified `NOT RUN`. Commit.

---

## Step 8 — Impact summary + FE handoff  **[FULL TRACK]**

Only after Step 7 is green — the set of changed modules isn't final until then.

### 8a. `docs/tasks/<name>/impact_summary.md`

From [`assets/impact_summary.md`](assets/impact_summary.md). Built from the **actual** diff (`git diff --stat <base>...HEAD` + reading it), not from the plan:

- one table row per impacted module: **module · change · AC**. Include modules you only *touched* (wiring, seeders, config). Name modules exactly — "various services updated" is useless.
- **Contract changes** (added / changed / removed), **DB changes** (migrations by file name), **new env vars**, **breaking changes**.
- **What to regress manually** — the flows a human should click/query through, since this skill writes no tests.

### 8b. `docs/tasks/<name>/fe_handoff.md`

From [`assets/fe_handoff.md`](assets/fe_handoff.md). The note a frontend developer (or a FE agent) builds against:

- every client-facing operation with **copy-pasteable** GraphQL documents / HTTP requests / socket emits, example variables and example responses — taken from the final code, not the design (correct any drift);
- auth requirements, error cases and their shapes, enums and their meaning, redirects/URLs the FE must host, async behaviour the UI must handle (e.g. "status stays PENDING until the webhook confirms").

If the task has **no client-facing change**, still create the file with one line: `No client-facing contract changes in this task.` — so nobody has to wonder.

Both artifacts get frontmatter with `version`, `updated`, and `inputs:` pinned to `design.md@<version>` and the branch HEAD short SHA.

**✅** Tick Step 8, **close out the checklist**: every box ticked or annotated, final `version` bump. Commit.

---

## Step 9 — Hand back

Report with this contract, then stop:

```
IMPLEMENT: <name>
  Branch .......... feature/<name> (from <base>@<sha>) · <n> commits · not pushed
  Artifacts ....... docs/tasks/<name>/implementation_checklist.md@x.y.z  (<n>/<n> ticked)
                    docs/tasks/<name>/design.md@x.y.z
                    docs/tasks/<name>/impact_summary.md@x.y.z
                    docs/tasks/<name>/fe_handoff.md@x.y.z
  Inputs .......... <n> files (<n> copied into inputs/)
  ACs ............. <n>/<n> met  (list any NOT MET)
  Validation ...... lint PASS · build PASS · migrations PASS|NOT RUN (<why>) · boot PASS|NOT RUN · AC cross-check PASS · review PASS
  Tests ........... none written (out of scope for this skill)
  Assumptions ..... <list or none>
  Open questions .. <list or none>
  Follow-ups ...... <list or none>
  → READY FOR HUMAN REVIEW
```

### Fast-track report

```
IMPLEMENT (fast track): <one-line description>
  Triage .......... FAST — <why: single module, no contract change, no dependents>
  Branch .......... <branch> · 1 commit · not pushed
  Changed ......... <file>: <what>  (<n> files)
  Best practices .. <rules consulted>
  Validation ...... lint PASS · build PASS · (AC cross-check, migrations, boot: SKIPPED — fast track)
  Notes ........... <anything that argues for a full-track pass, or none>
```

---

## Commit protocol (both tracks)

- **Commit per completed step** (full track) or once (fast track). Each commit includes the code for that step *and* the checklist update describing it.
- **Message style:** match the repo's recent history (`git log --format=%s -15`) — prefix, tense, casing. If there's no discernible convention, use Conventional Commits (`feat(payments): add stripe wrapper`). Subject ≤ 72 chars; body lists the AC(s) served.
- Follow the session's commit-attribution rules (e.g. a `Co-Authored-By` trailer) if any are in effect.
- Stage explicit paths (`git add <files>`), never `git add -A` — don't sweep in unrelated local files (`.env`, editor files, scratch output).
- Never `--amend` a commit you didn't create in this run, never rewrite history, never push.
- A pre-commit hook fails → fix the cause and make a new commit; never `--no-verify`.

## Notes

- **Universal by design.** Nothing here is specific to one project: commands come from `package.json`, conventions from the repo's own `CLAUDE.md`/`AGENTS.md`, precedents from its code. When a repo's house rules contradict this file, the repo wins — note the override in the design doc.
- **Artifacts live in `docs/tasks/<name>/`** and are committed with the code, so a reviewer sees requirements → design → diff → impact in one branch. They stay in the repo after merge as the history of why the code looks the way it does.
- **The checklist is created first** because a checklist written after the work is a summary and proves nothing; written first and updated per step, it's what lets an interrupted run resume (`/implement` with the same name picks it back up).
- **The design gate is the one mandatory human stop** inside a run. Everything before it is reading; everything after it changes code. It's cheap to fix a contract in a markdown file and expensive to fix it in a resolver, a migration and a frontend at once.
