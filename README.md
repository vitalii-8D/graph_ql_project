# GraphQL Project with NestJS

A comprehensive GraphQL API built with NestJS, TypeORM, and PostgreSQL featuring multiple entity relationships, full CRUD operations, and social sharing with Open Graph Protocol.

## Features

- **GraphQL API** with Apollo Server
- **TypeORM** integration with PostgreSQL database and migrations
- **User Model** with email, name, and age fields
- **One-to-One Relationship**: Post ↔ OpenGraph Metadata
- **Many-to-Many Relationship**: Post ↔ Category
- **Full CRUD Operations** for Users, Posts, and OpenGraph Metadata via GraphQL resolvers
- **Social Sharing** with Facebook, Twitter, and LinkedIn integration
- **Open Graph Protocol** implementation for rich media sharing
- **Database Seeders** generating randomized users, posts, and OpenGraph metadata with configurable counts
- **Input Validation** using class-validator

## Entity Relationships

### User Entity

- **Fields**: id, email, name, age
- **One-to-Many**: User has many Posts

### Post Entity

- **Fields**: id, title, content, published, createdAt, updatedAt
- **Many-to-One**: Post belongs to one User (author)
- **Many-to-Many**: Post can have many Categories

### Category Entity

- **Fields**: id, name, description
- **Many-to-Many**: Category can have many Posts

### OpenGraph Metadata Entity

- **Fields**: title, description, type, url, image, author, publisher, tags, video/audio URLs, product pricing, event timing, location data, Twitter card settings
- **One-to-One**: OpenGraph Metadata belongs to one Post
- **Purpose**: Rich social media sharing with Facebook, Twitter, LinkedIn

## Installation

```bash
  npm install
```

Copy `.env.example` to `.env` and fill in the values (database credentials, `JWT_SECRET`, `PASSWORD_SECRET`, etc.):

```bash
  cp .env.example .env
```

## Database Setup

Start a local PostgreSQL instance with Docker Compose:

```bash
  docker compose up -d postgres
```

Then run migrations and (optionally) seed the database:

```bash
  # Run migrations
  npm run migrate

  # Seed the database with generated sample data (includes OpenGraph metadata)
  npm run seed
```

## Running the Application

```bash
  # development
  npm run start:dev

  # production
  npm run build
  npm run start:prod
```

The GraphQL Playground will be available at: `http://localhost:3000/graphql`

## Database

The project uses PostgreSQL, run locally via Docker Compose (see `docker-compose.yaml`). Connection settings are read from environment variables (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`), defaulting to `localhost:5432` / `postgres` / `postgres` / `pdp_local`.

- **Type**: PostgreSQL
- **Migrations**: Enabled (use `npm run migrate` to apply schema changes, `npm run migrate:revert` to roll back the last one)
- **Auto-sync**: Disabled (schema changes always go through a migration)
- **Logging**: Disabled
- **Seeders**: Randomized sample data with OpenGraph metadata (`npm run seed`, see below)

## Seeding the Database

`npm run seed` populates the database with fake users, posts, categories, and OpenGraph metadata generated with `@faker-js/faker`.

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
- After seeding, a breakdown is printed to the console showing which posts (by title) belong to which user (by id/name).

## Technology Stack

- **NestJS** - Progressive Node.js framework
- **GraphQL** - Query language for APIs
- **Apollo Server** - GraphQL server
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Relational database
- **Docker Compose** - Local PostgreSQL setup
- **@faker-js/faker** - Fake data generation for database seeding
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation
- **Jest** - Testing framework
