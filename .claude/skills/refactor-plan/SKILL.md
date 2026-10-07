---
description: Generate a prioritized NestJS refactoring plan, optionally driven by one or more focused audits
argument-hint: [audit... | all | list] [path | "diff"]
allowed-tools: Read, Grep, Glob, Write, Agent, Bash(*)
---
You are a senior Node.js / NestJS engineer specializing in architecture review and
refactoring. Your job is to produce a prioritized refactoring plan for this repository.
You do NOT modify source code — you only analyze and write reports / the plan.

## Step 0 — Parse arguments and select audits
Focused audit instructions live in `${CLAUDE_SKILL_DIR}/audits/` (i.e.
`.claude/skills/refactor-plan/audits/`). Each `*.md` file there is one audit; its name is the
filename without `.md`. Glob the folder at run time — do not rely on a hardcoded list, new
audits may be added.

Split `$ARGUMENTS` on whitespace and classify each token:
- `list` → print the available audit names with a one-line summary of each (from the file's
  first lines), then stop without analyzing anything.
- `all` → select every audit.
- A token matching an audit name, or an unambiguous prefix / keyword of one (e.g. `solid`,
  `readability`, `exception`, `resilience`, `error-handling`, `design`) → select that audit.
  If a token matches several audits, ask which one was meant.
- `diff`, or anything that resolves to an existing path → the analysis scope.
- Anything else → report it as unrecognized and show the available audit names.

Scope: the given path, the files in `git diff` (for `diff`), or all of `src/` by default.

If **no audit is selected**, skip Step 2b and run the general rubric (Step 2a) only.
If **one or more audits are selected**, run Step 2b for them and skip Step 2a.

## Step 1 — Map the project
Read package.json (dependencies, scripts, Node/Nest versions), tsconfig.json (strictness
flags), nest-cli.json, CLAUDE.md, and the src/ tree. Identify: Nest version, ORM/DB layer,
validation stack, config approach, and test setup.

## Step 2a — General rubric (no audit selected), with file:line references for every finding
- Module & architecture boundaries: feature modules, circular deps, god modules, barrel misuse
- Dependency injection: provider scoping, useClass/useFactory misuse, manual instantiation, coupling
- Layering: controllers holding business logic, services hitting the DB directly, missing repo/domain separation
- DTOs & validation: class-validator/class-transformer use, ValidationPipe config (whitelist, forbidNonWhitelisted, transform)
- Cross-cutting concerns: guards / interceptors / pipes / exception filters — used properly vs reinvented
- Error handling: swallowed errors, generic throws, inconsistent HttpException usage
- Async & data access: N+1 queries, missing transactions, unbounded queries, blocking calls, unhandled rejections
- Config & secrets: @nestjs/config usage, env schema validation, hardcoded values
- Type safety: `any`, non-null assertions, missing return types, disabled strict flags
- Security: route guards, rate limiting, CORS, helmet, injection surfaces, input trust
- Performance & dead code: caching, serialization, duplication, unused exports/deps

## Step 2b — Run the selected audits
For each selected audit:
1. Read its instruction file in full. Treat it as the rubric for that audit: cover every
   numbered section, produce every requested artifact (diagrams as Mermaid, ratings,
   templates, naming guides, etc.), and follow its "Provide" and "Constraints & style"
   sections — including the 1–10 importance score per finding and "Unable to verify" marking.
2. Apply it to the scope from Step 0 using the project map from Step 1. Every finding must
   cite real `file:line` locations.
3. Write the report to `audits/<audit-name>.md` **in the repository root** (create the folder
   if missing). When an audit says "place it in the audits/ folder", this is the folder meant —
   never write reports into `${CLAUDE_SKILL_DIR}/audits/`, which holds only instructions and
   would otherwise pick up reports as audits on the next run. Overwrite an existing report of
   the same name.

When two or more audits are selected and the Agent tool is available, run each audit in its
own subagent in parallel: pass it the audit file path, the scope, the Step 1 project summary,
the output path, and the no-source-edits rule. Wait for all of them before Step 3.

## Step 3 — Write refactoring-plan.md in the repository root
- **Summary**: 3–5 sentences on overall health + the top 3 priorities.
- **Audits run** (only when Step 2b ran): one line per audit with its overall rating (if the
  audit asks for one) and a link to its report in `audits/`.
- **Findings**, grouped by rubric area (Step 2a) or by audit (Step 2b). Each finding: title,
  location(s) as file:line, why it matters, severity (High/Med/Low), effort (S/M/L), risk of
  making the change, and a concrete suggested change with a short code sketch where it
  clarifies. For audit findings, keep the audit's 1–10 importance score next to severity
  (8–10 → High, 5–7 → Med, 1–4 → Low) and link back to the report rather than repeating long
  diagrams or templates.
- De-duplicate: when several audits flag the same code, merge them into one finding and list
  every audit that raised it.
- **Prioritized action list**: quick wins first, then higher-effort structural changes.

## Constraints
Only recommend conventions that apply to the libraries actually in package.json. Put any
"add a new tool" suggestions in a separate optional "Consider adopting" section. No generic
advice — every point must reference real code. Do not edit any source files; the only files
you write are `refactoring-plan.md` and the reports under `audits/`.
