# GraphQL Project with NestJS

A comprehensive GraphQL API built with NestJS, TypeORM, and SQLite featuring multiple entity relationships, full CRUD operations, and social sharing with Open Graph Protocol.

## Features

- **GraphQL API** with Apollo Server
- **TypeORM** integration with SQLite database and migrations
- **User Model** with email, name, and age fields
- **One-to-One Relationship**: Post ↔ OpenGraph Metadata
- **Many-to-Many Relationship**: Post ↔ Category
- **Full CRUD Operations** for Users, Posts, and OpenGraph Metadata via GraphQL resolvers
- **Social Sharing** with Facebook, Twitter, and LinkedIn integration
- **Open Graph Protocol** implementation for rich media sharing
- **Database Seeders** with sample data including OpenGraph metadata
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

## Database Setup

```bash
  # Run migrations
  npm run migrate

  # Seed the database with sample data (includes OpenGraph metadata)
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

The project uses SQLite for simplicity. The database file (`database.sqlite`) is automatically created on first run.

- **Type**: SQLite
- **Migrations**: Enabled (use `npm run migration:run` to apply schema changes)
- **Auto-sync**: Disabled (use migrations in production)
- **Logging**: Disabled (SQL queries logged to console)
- **Seeders**: Sample data with OpenGraph metadata (`npm run seed`)

## Technology Stack

- **NestJS** - Progressive Node.js framework
- **GraphQL** - Query language for APIs
- **Apollo Server** - GraphQL server
- **TypeORM** - ORM for TypeScript
- **SQLite** - Lightweight database
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation
- **Jest** - Testing framework
