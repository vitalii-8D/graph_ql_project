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

# Elasticsearch
npm run es:reindex            # rebuild ES indices from Postgres (flags: -i/--index users|posts|comments|all, -r/--recreate)
```

There is no top-level `dev`/`test` combined script and no CI config in-repo — treat lint, build, and test as the three checks to run before considering a change done. Unit test coverage is currently thin (only one `.spec.ts` file exists, under `open-graph/services/`) — don't assume a resolver or service has tests just because the domain does.

### Database

The DB is PostgreSQL, started locally via `docker compose up -d postgres elasticsearch` (see `docker-compose.yaml`; Postgres connects on `localhost:5432`, credentials/db name default to `postgres`/`postgres`/`pdp_local`, overridable via `DATABASE_HOST`/`DATABASE_PORT`/`DATABASE_USER`/`DATABASE_PASSWORD`/`DATABASE_NAME` in `.env`; Elasticsearch (single-node, security disabled, for local dev only) listens on `localhost:9200`, overridable via `ELASTICSEARCH_NODE`). `README.md` still describes an older SQLite setup — that's stale; `src/database/database.config.ts` is the source of truth. `synchronize` is disabled, so schema changes always go through a migration (`npm run migrate:generate` after editing entities, then `npm run migrate`). Elasticsearch indices are created on boot (`IndexSetupService`) and populated/rebuilt via `npm run es:reindex` — run it after seeding or whenever Postgres and ES drift.

`npm run seed` accepts optional flags: `-u`/`--users` (number of fake users to generate, default `4`, must be `>= 1`) and `-p`/`--posts` (number of fake posts to spread randomly across those users, default `10`, must be `>= 0`). `SeederService` (`src/database/seeds/seeder.service.ts`) uses `@faker-js/faker` to generate users/posts/OpenGraph metadata/comments/payment transactions and hashes every seeded user's password from the same mocked plaintext constant. Categories are looked up by their unique `name` before insert so re-running the seed doesn't collide with existing rows. Payment transactions are seeded last (`createPaymentTransactions`, after posts/comments): every `PUBLISHED` post gets a fake `SUCCEEDED` transaction (and `hasBeenPublished`/`paymentStatus` set to match), a sample of `DRAFT` posts get `FAILED`/`PENDING` transactions, and a couple of previously-published posts are flipped back to `DRAFT`/`REFUNDED` with a matching refunded transaction — this exercises the retry and refund-history UI paths without ever calling the real Stripe API from the seeder.

## Architecture

NestJS app exposing a single **GraphQL** endpoint (Apollo Server, code-first, schema auto-generated to `src/database/schema.gql` — do not hand-edit that file), a **Socket.IO WebSocket gateway** for chat, and a small number of plain REST routes (Stripe webhook, see Payments below).

### Module layout

Each domain lives under `src/<domain>/` with a consistent internal shape: `entities/` (TypeORM + GraphQL `@ObjectType` in one class), `dto/` (`@InputType` classes using class-validator), a `.service.ts` (data access via TypeORM repositories), a `.resolver.ts` (GraphQL), and a `.module.ts` wiring `TypeOrmModule.forFeature([...])` plus providers. Domains: `users`, `posts`, `categories`, `comments`, `open-graph`, `chat`, `auth`, `analytics`, `payments`. `elasticsearch` is cross-cutting infra rather than a domain (see below). Cross-cutting code lives in `utils/` (e.g. `password.util.ts`, wrapped as `UtilsModule`) and `helpers/` (currently just `graphql-logging.plugin.ts`, an Apollo `@Plugin()` registered via `AppModule` providers that logs each GraphQL operation's name/variables/timing to the console, redacting password/token fields).

Root wiring is `src/app.module.ts`. Note that `src/database/database.config.ts` (used by both `TypeOrmModule.forRoot` in `app.module.ts` and by `database.source.ts` for the CLI migration runner) explicitly lists entity classes — a newly-added entity must be added there or TypeORM won't see it, even if its module also calls `TypeOrmModule.forFeature([...])`. (`ChatRoomEntity`/`ChatMessageEntity` are present in that list and have a matching migration — chat persistence works against a fresh database.)

### Elasticsearch

`src/elasticsearch/` is a `@Global()` infra module (`ElasticsearchModule`, mirroring `UtilsModule`) wrapping `@elastic/elasticsearch`'s `Client` in `ElasticsearchService` (index/update/delete/search/msearch/bulk helpers — writes log-and-swallow on failure so an ES outage never fails a Postgres write; reads/searches surface errors normally). Index mappings live in `src/elasticsearch/mappings/`. Each of `users`/`posts`/`comments` has a small `*-index.service.ts` (`UserIndexService`, `PostIndexService`, `CommentIndexService`) that maps its entity to an ES document and is called from the owning service's `create`/`update`/`remove` methods — `PostIndexService.reindexOne` is the single place `author.name`/`categories.name`/`paymentStatus` get denormalized onto a post document, also invoked whenever `PostsService.updateCommentAggregates` runs (i.e. whenever a comment changes) and whenever `PaymentsService` flips a post's payment/publish state. `npm run es:reindex` (`src/elasticsearch/reindex.ts`) rebuilds indices from Postgres in batches, skipping documents whose content hash (`_hash` field) hasn't changed unless `--recreate` is passed. `UsersResolver.searchUsers` and `PostsResolver.searchPosts` query ES directly (fuzzy `multi_match`/`query_string`, geo/category/date/reading-time filters, `search_after` cursor pagination) then re-hydrate the matched ids from Postgres so existing `@ResolveField`s keep working unmodified. `src/analytics/` exposes one admin-only `analyticsDashboard` query (`@Roles(UserRole.ADMIN)`) covering ES-only aggregations (user growth, geo clustering, comment velocity, sentiment, significant terms, etc.) via a single `msearch` batch — it deliberately does **not** duplicate `CommentsResolver`'s existing Postgres-backed `commentsPerPost`/`commentsPerUser`/`commentsPerPeriod`/`commentRatingDistribution` queries.

`AppController`'s `GET /` redirects to `/posts`, which has no matching route — the repo is mid-migration to a separate React frontend, so there's currently no server-rendered HTML path (no Handlebars views, no `/posts` web controller).

### Auth

JWT-based auth (`@nestjs/passport` + `passport-jwt`), configured in `auth/auth.module.ts`. `JwtStrategy` (`auth/strategies/jwt.strategy.ts`) validates the bearer token against `JWT_SECRET` and calls `AuthService.validatePayload`. Two guards exist: `JwtAuthGuard`/`GqlAuthGuard` (require a valid token — the Gql variant pulls the request off `GqlExecutionContext` since Nest's default guard doesn't understand GraphQL context) and `RolesGuard` (checks `UserRole` via the `@Roles(...)` decorator against `ROLES_KEY` metadata). `@CurrentUser()` param decorator pulls `req.user` out of GraphQL context. Roles are `UserRole.USER` / `UserRole.ADMIN` (`src/users/enums.ts`). Passwords are hashed with `argon2` (`utils/password.util.ts`, peppered with `PASSWORD_SECRET`).

The WebSocket gateway (`chat/chat.gateway.ts`) does **not** use the passport guards — `handleConnection` manually extracts and verifies the JWT from the `Authorization` handshake header and attaches the resolved user to `client.data.user`; every `@SubscribeMessage` handler reads `client.data.user` directly (see `adminBroadcast` for the role check pattern).

### Payments (Stripe-gated post publishing)

A post requires a **one-time** Stripe payment before it can be published for the first time; once published once, re-publishing/archiving/drafting is free forever (`PostEntity.hasBeenPublished`, set once and never reset except by a refund). `PostEntity.paymentStatus` (`PostPaymentStatus`: `NOT_REQUIRED | PENDING | SUCCEEDED | FAILED | REFUNDED`, `src/posts/enums.ts`) is a stored, denormalized gate column — not a computed field — so both the Postgres query (`PostsService.findAll`) and the ES query (`PostsService.searchPosts`) can filter on it directly; a post is only publicly visible with `status = PUBLISHED` **and** `paymentStatus` in `SUCCEEDED`/`NOT_REQUIRED`. Owner-facing queries (a user's own posts) intentionally do **not** apply this filter, so owners can see their own `PENDING`/`FAILED` posts.

`PostsService.updatePost` still handles `DRAFT`/`ARCHIVED` transitions and free re-publish (`status: PUBLISHED` when `hasBeenPublished` is already `true`) directly — but throws `BadRequestException` if asked to set `PUBLISHED` on a post that has never been published, forcing callers through the payment flow below instead of silently branching inside `updatePost`.

`src/payments/` owns the flow:
- `services/stripe.service.ts` — the **only** file allowed to `import Stripe from 'stripe'`; every other file (resolver, controller, `PaymentsService`) goes through it. Wraps checkout session creation, PaymentIntent retrieval, webhook event construction/verification, and refunds.
- `payments.service.ts` — `publishPost`/`retryPostPayment` create a Stripe Checkout Session + a `PENDING` `PaymentTransactionEntity` (never flip `post.status` synchronously — Stripe confirms asynchronously); `handleWebhookEvent` is the single source of truth that flips a post to `PUBLISHED`/`hasBeenPublished = true`/`paymentStatus = SUCCEEDED` (or `FAILED`) once Stripe confirms — the FE never polls or checks payment status itself, it only displays whatever this handler has already written. `refundPayment` calls Stripe then reverts the post to `DRAFT`/`hasBeenPublished = false`/`paymentStatus = REFUNDED`.
- `payments.resolver.ts` — GraphQL mutations `publishPost`, `retryPostPayment`, `refundPayment` (all `GqlAuthGuard` + ownership-checked, admin bypass via `UserRole.ADMIN`) and queries `myTransactions`/`transactionsForPost`.
- `payments.controller.ts` — plain REST `POST /stripe/webhook` (no auth guard — the Stripe signature check *is* the auth). Requires the raw request body for signature verification, which is why `main.ts` creates the Nest app with `{ rawBody: true }` (exposes `req.rawBody` on every request without disabling the normal JSON body parser used by GraphQL). This is the app's only real precedent for a raw-body REST route — `AppController`'s `GET /` redirect is the only other REST endpoint in the app.
- A `PaymentTransactionEntity` (`payment_transactions` table) row is kept for **every** attempt (succeeded or failed, with `failureReason`), keyed initially on `stripeCheckoutSessionId`; `stripePaymentIntentId` is backfilled once the webhook reveals it (Stripe only creates the PaymentIntent once checkout completes, so it's unknown at session-creation time — `payment_intent.payment_failed` events don't carry the originating checkout session, so `PaymentsService` falls back to `StripeService.findCheckoutSessionIdForPaymentIntent` to bridge the two ids).
- Note: the original spec (`.local/payments/be-payments.md`) also called for a `GET /check-payment` REST endpoint sharing the same sync logic as the webhook, for the FE success page to trigger on-demand — that endpoint was **not** implemented; only the webhook path exists today.
- Config lives under `config.stripe` in `src/constants/config.ts` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, all in `REQUIRED_ENV_VARS`), plus `config.app.webUrl` (`WEB_URL`) used to build the Checkout Session's `success_url`/`cancel_url` (`${webUrl}/payments/success?postId=...` / `.../cancel?postId=...` — only `postId` is known at session-creation time, not the PaymentIntent id).

### Chat (WebSocket)

`chat.gateway.ts` handles real-time events (`joinRoom`, `leaveRoom`, `sendMessage`, `adminBroadcast`) over Socket.IO rooms named `room-<roomId>`; `chat.service.ts` does the persistence (TypeORM) for `ChatRoomEntity`/`ChatMessageEntity`; `chat.resolver.ts` exposes room CRUD/listing over GraphQL (guarded with `GqlAuthGuard`/`RolesGuard`, room creation is admin-only). A JS test client (`public/chat-test.html`, served statically) exercises these events directly — check it before renaming events or changing payload shapes.

### Open Graph / social sharing

`open-graph/services/open-graph.service.ts` manages `OpenGraphMetadataEntity` (one-to-one with `PostEntity`); `open-graph/services/social-sharing.service.ts` builds Facebook/Twitter/LinkedIn share links and generates Open Graph `<meta>` tag HTML (share URLs are built from `baseUrl` + the post's `slug`); both are exposed together through `open-graph/open-graph.resolver.ts`.

### Conventions

- Per-domain `types.ts` / `enums.ts` files (flat, at the domain root, e.g. `src/auth/types.ts`, `src/open-graph/enums.ts`, `src/users/enums.ts`, `src/payments/enums.ts`) hold shared TypeScript types/enums for that domain — prefer adding to these over creating new `types/` or `enums/` subfolders. Truly cross-domain shared code goes in the top-level `src/types/` (e.g. `gql-context.ts`), `src/enums/`, and `src/constants/` instead.
- Entities double as GraphQL types: TypeORM decorators (`@Entity`, `@Column`) and GraphQL decorators (`@ObjectType`, `@Field`) live on the same class.
- DTOs use `class-validator` decorators and are GraphQL `@InputType`s, not plain interfaces.
- ESLint uses `typescript-eslint` recommendedTypeChecked + prettier; `no-explicit-any` is off, `no-floating-promises`/`no-unsafe-argument` are warnings only. Prettier: single quotes, trailing commas, 120 print width.
- Node >= 26, npm >= 11 (see `.nvmrc` / `package.json engines`).