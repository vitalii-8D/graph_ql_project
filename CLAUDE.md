# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev          # start with watch mode
npm run start:debug        # start with --inspect + watch
npm run build               # nest build
npm run start:prod          # run compiled dist/main

# Lint / format
npm run lint                 # eslint --fix over src, apps, libs, test
npm run format                # prettier --write src/** test/**

# Tests
npm test                     # jest unit tests (*.spec.ts under src/)
npm run test:watch
npm run test:cov
npm run test:e2e             # jest -c test/jest-e2e.json
npx jest src/posts/posts.resolver.spec.ts   # run a single test file
npx jest -t "should create a post"          # run tests matching a name

# Database (SQLite file at ./database.sqlite)
npm run migrate:generate     # generate a migration from entity changes
npm run migrate:create       # create an empty migration
npm run migrate               # run pending migrations
npm run migrate:revert        # revert the last migration
npm run seed                  # run src/database/seeds/seed.ts
```

There is no top-level `dev`/`test` combined script and no CI config in-repo — treat lint, build, and test as the three checks to run before considering a change done.

## Architecture

NestJS app exposing a single **GraphQL** endpoint (Apollo Server, code-first, schema auto-generated to `src/database/schema.gql` — do not hand-edit that file) plus a **Socket.IO WebSocket gateway** for chat, and a couple of server-rendered Handlebars routes for Open Graph social previews.

### Module layout

Each domain lives under `src/<domain>/` with a consistent internal shape: `entities/` (TypeORM + GraphQL `@ObjectType` in one class), `dto/` (`@InputType` classes using class-validator), a `.service.ts` (data access via TypeORM repositories), a `.resolver.ts` (GraphQL), and a `.module.ts` wiring `TypeOrmModule.forFeature([...])` plus providers. Domains: `users`, `posts`, `categories`, `open-graph`, `chat`, `auth`. Cross-cutting helpers live in `utils/` (e.g. `password.util.ts`, wrapped as `UtilsModule`) and `helpers/` (Express-level setup called from `main.ts`: Handlebars registration, Morgan logging).

Root wiring is `src/app.module.ts`. Note that `src/database/database.config.ts` (used by both `TypeOrmModule.forRoot` in `app.module.ts` and by `database.source.ts` for the CLI migration runner) explicitly lists entity classes — a newly-added entity must be added there or TypeORM won't see it, even if its module also calls `TypeOrmModule.forFeature([...])`.

### Auth

JWT-based auth (`@nestjs/passport` + `passport-jwt`), configured in `auth/auth.module.ts`. `JwtStrategy` (`auth/strategies/jwt.strategy.ts`) validates the bearer token against `JWT_SECRET` and calls `AuthService.validatePayload`. Two guards exist: `JwtAuthGuard`/`GqlAuthGuard` (require a valid token — the Gql variant pulls the request off `GqlExecutionContext` since Nest's default guard doesn't understand GraphQL context) and `RolesGuard` (checks `UserRole` via the `@Roles(...)` decorator against `ROLES_KEY` metadata). `@CurrentUser()` param decorator pulls `req.user` out of GraphQL context. Roles are `UserRole.USER` / `UserRole.ADMIN` (`src/users/enums.ts`). Passwords are hashed with `argon2` (`utils/password.util.ts`).

The WebSocket gateway (`chat/chat.gateway.ts`) does **not** use the passport guards — `handleConnection` manually extracts and verifies the JWT from the `Authorization` handshake header and attaches the resolved user to `client.data.user`; every `@SubscribeMessage` handler reads `client.data.user` directly (see `adminBroadcast` for the role check pattern).

### Chat (WebSocket)

`chat.gateway.ts` handles real-time events (`joinRoom`, `leaveRoom`, `sendMessage`, `adminBroadcast`) over Socket.IO rooms named `room-<roomId>`; `chat.service.ts` does the persistence (TypeORM) for `ChatRoomEntity`/`ChatMessageEntity`; `chat.resolver.ts` exposes room CRUD/listing over GraphQL. Full event contract and payload shapes are documented in `WEBSOCKET_CHAT_README.md` — consult it before changing event names or payloads, since a JS test client (`public/chat-test.html`, served statically) depends on them.

### Open Graph / social sharing

`open-graph/services/open-graph.service.ts` manages `OpenGraphMetadataEntity` (one-to-one with `PostEntity`). `social-sharing.service.ts` builds Facebook/Twitter/LinkedIn share links and generates Open Graph `<meta>` tag HTML. `posts-web.controller.ts` + `helpers/register-handlebars.ts` + `views/` render server-side pages at `/posts` and `/posts/:id` with live OG tags, for social-platform crawlers (Facebook/Twitter debuggers, ngrok) — these are plain Express/Handlebars routes, not GraphQL.

### Conventions

- Per-domain `types.ts` / `enums.ts` files (flat, at the domain root, e.g. `src/auth/types.ts`, `src/open-graph/enums.ts`, `src/users/enums.ts`) hold shared TypeScript types/enums for that domain — prefer adding to these over creating new `types/` or `enums/` subfolders.
- Entities double as GraphQL types: TypeORM decorators (`@Entity`, `@Column`) and GraphQL decorators (`@ObjectType`, `@Field`) live on the same class.
- DTOs use `class-validator` decorators and are GraphQL `@InputType`s, not plain interfaces.
- ESLint uses `typescript-eslint` recommendedTypeChecked + prettier; `no-explicit-any` is off, `no-floating-promises`/`no-unsafe-argument` are warnings only. Prettier: single quotes, trailing commas, 120 print width.
- Node >= 26, npm >= 11 (see `.nvmrc` / `package.json engines`).