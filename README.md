# GraphQL Project with NestJS

A NestJS application exposing a single **GraphQL** endpoint (Apollo Server, code-first, schema auto-generated to `src/database/schema.gql`), a **Socket.IO** WebSocket gateway for chat, and a small number of plain REST routes (Stripe webhook). Data is persisted in **PostgreSQL** via TypeORM, with **Elasticsearch** powering search/analytics as a secondary, best-effort index.

## Features

- **GraphQL API** with Apollo Server (code-first, schema auto-generated — do not hand-edit `src/database/schema.gql`)
- **JWT Authentication** (`@nestjs/passport` + `passport-jwt`) with role-based access (`USER` / `ADMIN`), passwords hashed with `argon2`
- **Users, Posts, Categories, Comments** with full CRUD via GraphQL resolvers
- **One-to-One Relationship**: Post ↔ OpenGraph Metadata
- **Many-to-Many Relationship**: Post ↔ Category
- **Optimized relation eager-loading**: root queries inspect the GraphQL selection set and eager-load exactly the relations requested, instead of resolvers firing one query per field
- **Open Graph Protocol** implementation with Facebook/Twitter/LinkedIn share link generation
- **Real-time Chat** over a Socket.IO gateway (rooms, admin broadcast) backed by Postgres-persisted rooms/messages, with file attachments
- **Stripe-gated post publishing**: a post requires a one-time Stripe payment before its first publish; webhook-driven status updates, refunds, and per-post/per-user transaction history
- **Elasticsearch-backed search**: fuzzy/geo/category/date search over users and posts, plus an admin-only analytics dashboard (user growth, geo clustering, comment velocity, sentiment, significant terms)
- **Database Seeders** generating randomized users, posts, categories, comments, OpenGraph metadata, and payment transactions with configurable counts
- **Input Validation** using class-validator

## Installation

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the values (database credentials, `JWT_SECRET`, `PASSWORD_SECRET`, AWS S3, Elasticsearch, Stripe keys, etc.):

```bash
cp .env.example .env
```

## Database & Elasticsearch Setup

Start PostgreSQL and Elasticsearch locally with Docker Compose:

```bash
docker compose up -d postgres elasticsearch
```

Then run migrations and (optionally) seed the database:

```bash
# Run migrations
npm run migrate

# Seed the database with generated sample data
npm run seed

# Build Elasticsearch indices from the seeded Postgres data
npm run es:reindex
```

## Running the Application

```bash
# development (watch mode)
npm run start:dev

# development with debugger attached
npm run start:debug

# production
npm run build
npm run start:prod
```

The GraphQL Playground will be available at: `http://localhost:3000/graphql` (or whatever `PORT`/`SERVER_URL` is set to in `.env`).

## Database

The project uses PostgreSQL, run locally via Docker Compose (see `docker-compose.yaml`). Connection settings are read from environment variables (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`), defaulting to `localhost:5432` / `postgres` / `postgres` / `pdp_local`.

- **Type**: PostgreSQL
- **Migrations**: Enabled — schema changes always go through a migration, `synchronize` is disabled
- **Logging**: Disabled

```bash
npm run migrate:generate   # generate a migration from entity changes (needs a -n name via -- -n <Name>)
npm run migrate:create     # create an empty migration
npm run migrate            # run pending migrations
npm run migrate:revert     # revert the last migration
```

## Seeding the Database

`npm run seed` populates the database with fake users, posts, categories, comments, OpenGraph metadata, and payment transactions generated with `@faker-js/faker`.

```bash
# Default: 4 users, 10 posts
npm run seed

# Custom counts
npm run seed -- -u 10 -p 30
npm run seed -- --users 10 --posts 30
```

- `-u`, `--users` — number of users to generate. Must be `>= 1`. Defaults to `4`.
- `-p`, `--posts` — number of posts to generate, randomly spread across the generated users. Must be `>= 0`. Defaults to `10`.
- Every seeded user shares the same mocked password (hashed with `argon2` before being stored).
- Every post gets a randomly generated OpenGraph metadata record.
- Categories are looked up by name before insert, so re-running the seed against a non-empty database won't create duplicates.
- Payment transactions are seeded last: every `PUBLISHED` post gets a `SUCCEEDED` transaction, a sample of `DRAFT` posts get `FAILED`/`PENDING` transactions, and a couple of previously-published posts are flipped back to `DRAFT` with a matching `REFUNDED` transaction — no real Stripe API calls are made.
- After seeding, a breakdown is printed to the console showing which posts (by title) belong to which user (by id/name).

## Elasticsearch

Elasticsearch (single-node, security disabled, for local dev only) is used for full-text/fuzzy search on users and posts, and for the admin analytics dashboard. Indices are created automatically on app boot; use `es:reindex` to (re)populate them from Postgres:

```bash
npm run es:reindex                                    # reindex all indices (users, posts, comments), skipping unchanged docs
npm run es:reindex -- --recreate                      # drop and recreate all indices, then reindex everything
npm run es:reindex -- -r                              # same, short flag

npm run es:reindex -- --index posts                   # reindex a single index (users | posts | comments)
npm run es:reindex -- -i posts --recreate             # recreate + reindex a single index
```

> Flags must be passed after a `--` separator — `es:reindex` runs `ts-node` directly rather than delegating to another npm script, so without `--` the flag is consumed by npm itself and never reaches the script.

- `-i`, `--index` — which index to rebuild: `users`, `posts`, `comments`, or `all` (default).
- `-r`, `--recreate` — drop and recreate the index mapping before reindexing, instead of skipping documents whose content hash (`_hash`) hasn't changed.
- Run this after seeding, or any time Postgres and Elasticsearch drift.

## Testing

```bash
npm test                    # unit tests (*.spec.ts under src/)
npm run test:watch
npm run test:cov
npm run test:e2e            # jest -c test/jest-e2e.json

npx jest src/open-graph/services/social-sharing.service.spec.ts   # run a single test file
npx jest -t "should generate a valid Facebook share link"         # run tests matching a name
```

## Lint / Format

```bash
npm run lint       # eslint --fix over src, apps, libs, test
npm run format      # prettier --write src/** test/**
```

## Technology Stack

- **NestJS** - Progressive Node.js framework
- **GraphQL** / **Apollo Server** - Code-first GraphQL API
- **TypeORM** / **PostgreSQL** - ORM and relational database
- **Elasticsearch** (`@elastic/elasticsearch`) - Search and analytics
- **Socket.IO** (`@nestjs/websockets`, `@nestjs/platform-socket.io`) - Real-time chat gateway
- **Stripe** (`stripe`) - Payment processing for gated post publishing
- **AWS S3** (`@aws-sdk/client-s3`) - Direct-to-S3 file uploads
- **Passport / JWT** (`@nestjs/passport`, `passport-jwt`) - Authentication
- **argon2** - Password hashing
- **@faker-js/faker** - Fake data generation for database seeding
- **class-validator** / **class-transformer** - Input validation and object transformation
- **Docker Compose** - Local PostgreSQL + Elasticsearch setup
- **Jest** - Testing framework
