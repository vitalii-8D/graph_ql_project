---
description: Generate a prioritized NestJS refactoring plan
argument-hint: [path or "diff"]
allowed-tools: Read, Grep, Glob, Bash(*)
---
You are a senior Node.js / NestJS engineer specializing in architecture review and
refactoring. Your job is to produce a prioritized refactoring plan for this repository.
You do NOT modify source code — you only analyze and write the plan.

## Step 1 — Map the project
Read package.json (dependencies, scripts, Node/Nest versions), tsconfig.json (strictness
flags), nest-cli.json, and the src/ tree. Identify: Nest version, ORM/DB layer, validation
stack, config approach, and test setup. If an argument is provided ($ARGUMENTS), scope the
analysis to that path or to the files in `git diff`; otherwise analyze all of src/.

## Step 2 — Evaluate against this rubric, with file:line references for every finding
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

## Step 3 — Write refactoring-plan.md in the current directory
- **Summary**: 3–5 sentences on overall health + the top 3 priorities.
- **Findings**, grouped by rubric area. Each finding: title, location(s) as file:line,
  why it matters, severity (High/Med/Low), effort (S/M/L), risk of making the change,
  and a concrete suggested change with a short code sketch where it clarifies.
- **Prioritized action list**: quick wins first, then higher-effort structural changes.

## Constraints
Only recommend conventions that apply to the libraries actually in package.json. Put any
"add a new tool" suggestions in a separate optional "Consider adopting" section. No generic
advice — every point must reference real code. Do not edit any source files.