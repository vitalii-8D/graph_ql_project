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
pnpx jest src/open-graph/services/social-sharing.service.spec.ts   # run a single test file
npx jest -t "should generate a valid Facebook share link"         # run tests matching a name

# Database (PostgreSQL — see docker-compose.yaml, `docker compose up -d postgres`)
npm run migrate:generate     # generate a migration from entity changes
npm run migrate:create       # create an empty migration
npm run migrate               # run pending migrations
npm run migrate:revert        # revert the last migration
npm run seed                  # run src/database/seeds/seed.ts (see flags below)
```

There is no top-level `dev`/`test` combined script and no CI config in-repo — treat lint, build, and test as the three checks to run before considering a change done. Unit test coverage is currently thin (only one `.spec.ts` file exists, under `open-graph/services/`) — don't assume a resolver or service has tests just because the domain does.

### Database

The DB is PostgreSQL, started locally via `docker compose up -d postgres` (see `docker-compose.yaml`; connects on `localhost:5432`, credentials/db name default to `postgres`/`postgres`/`pdp_local`, overridable via `DATABASE_HOST`/`DATABASE_PORT`/`DATABASE_USER`/`DATABASE_PASSWORD`/`DATABASE_NAME` in `.env`). `README.md` still describes an older SQLite setup — that's stale; `src/database/database.config.ts` is the source of truth. `synchronize` is disabled, so schema changes always go through a migration (`npm run migrate:generate` after editing entities, then `npm run migrate`).

`npm run seed` accepts optional flags: `-u`/`--users` (number of fake users to generate, default `4`, must be `>= 1`) and `-p`/`--posts` (number of fake posts to spread randomly across those users, default `10`, must be `>= 0`). `SeederService` (`src/database/seeds/seeder.service.ts`) uses `@faker-js/faker` to generate users/posts/OpenGraph metadata and hashes every seeded user's password from the same mocked plaintext constant. Categories are looked up by their unique `name` before insert so re-running the seed doesn't collide with existing rows.

## Architecture

NestJS app exposing a single **GraphQL** endpoint (Apollo Server, code-first, schema auto-generated to `src/database/schema.gql` — do not hand-edit that file) plus a **Socket.IO WebSocket gateway** for chat.

### Module layout

Each domain lives under `src/<domain>/` with a consistent internal shape: `entities/` (TypeORM + GraphQL `@ObjectType` in one class), `dto/` (`@InputType` classes using class-validator), a `.service.ts` (data access via TypeORM repositories), a `.resolver.ts` (GraphQL), and a `.module.ts` wiring `TypeOrmModule.forFeature([...])` plus providers. Domains: `users`, `posts`, `categories`, `open-graph`, `chat`, `auth`. Cross-cutting code lives in `utils/` (e.g. `password.util.ts`, wrapped as `UtilsModule`) and `helpers/` (currently just `graphql-logging.plugin.ts`, an Apollo `@Plugin()` registered via `AppModule` providers that logs each GraphQL operation's name/variables/timing to the console, redacting password/token fields).

Root wiring is `src/app.module.ts`. Note that `src/database/database.config.ts` (used by both `TypeOrmModule.forRoot` in `app.module.ts` and by `database.source.ts` for the CLI migration runner) explicitly lists entity classes — a newly-added entity must be added there or TypeORM won't see it, even if its module also calls `TypeOrmModule.forFeature([...])`. **As of now, `ChatRoomEntity`/`ChatMessageEntity` are missing from that list** (and there is no migration creating their tables), so the chat feature's persistence layer will not work against a fresh database until that's fixed — check this before assuming chat is fully wired.

`AppController`'s `GET /` redirects to `/posts`, which has no matching route — the repo is mid-migration to a separate React frontend, so there's currently no server-rendered HTML path (no Handlebars views, no `/posts` web controller).

### Auth

JWT-based auth (`@nestjs/passport` + `passport-jwt`), configured in `auth/auth.module.ts`. `JwtStrategy` (`auth/strategies/jwt.strategy.ts`) validates the bearer token against `JWT_SECRET` and calls `AuthService.validatePayload`. Two guards exist: `JwtAuthGuard`/`GqlAuthGuard` (require a valid token — the Gql variant pulls the request off `GqlExecutionContext` since Nest's default guard doesn't understand GraphQL context) and `RolesGuard` (checks `UserRole` via the `@Roles(...)` decorator against `ROLES_KEY` metadata). `@CurrentUser()` param decorator pulls `req.user` out of GraphQL context. Roles are `UserRole.USER` / `UserRole.ADMIN` (`src/users/enums.ts`). Passwords are hashed with `argon2` (`utils/password.util.ts`, peppered with `PASSWORD_SECRET`).

The WebSocket gateway (`chat/chat.gateway.ts`) does **not** use the passport guards — `handleConnection` manually extracts and verifies the JWT from the `Authorization` handshake header and attaches the resolved user to `client.data.user`; every `@SubscribeMessage` handler reads `client.data.user` directly (see `adminBroadcast` for the role check pattern).

### Chat (WebSocket)

`chat.gateway.ts` handles real-time events (`joinRoom`, `leaveRoom`, `sendMessage`, `adminBroadcast`) over Socket.IO rooms named `room-<roomId>`; `chat.service.ts` does the persistence (TypeORM) for `ChatRoomEntity`/`ChatMessageEntity`; `chat.resolver.ts` exposes room CRUD/listing over GraphQL (guarded with `GqlAuthGuard`/`RolesGuard`, room creation is admin-only). A JS test client (`public/chat-test.html`, served statically) exercises these events directly — check it before renaming events or changing payload shapes. See the database.config gotcha above before assuming chat persistence works out of the box.

### Open Graph / social sharing

`open-graph/services/open-graph.service.ts` manages `OpenGraphMetadataEntity` (one-to-one with `PostEntity`); `open-graph/services/social-sharing.service.ts` builds Facebook/Twitter/LinkedIn share links and generates Open Graph `<meta>` tag HTML (share URLs are built from `baseUrl` + the post's `slug`); both are exposed together through `open-graph/open-graph.resolver.ts`.

### Conventions

- Per-domain `types.ts` / `enums.ts` files (flat, at the domain root, e.g. `src/auth/types.ts`, `src/open-graph/enums.ts`, `src/users/enums.ts`) hold shared TypeScript types/enums for that domain — prefer adding to these over creating new `types/` or `enums/` subfolders. Truly cross-domain shared code goes in the top-level `src/types/` (e.g. `gql-context.ts`), `src/enums/`, and `src/constants/` instead.
- Entities double as GraphQL types: TypeORM decorators (`@Entity`, `@Column`) and GraphQL decorators (`@ObjectType`, `@Field`) live on the same class.
- DTOs use `class-validator` decorators and are GraphQL `@InputType`s, not plain interfaces.
- ESLint uses `typescript-eslint` recommendedTypeChecked + prettier; `no-explicit-any` is off, `no-floating-promises`/`no-unsafe-argument` are warnings only. Prettier: single quotes, trailing commas, 120 print width.
- Node >= 26, npm >= 11 (see `.nvmrc` / `package.json engines`).
