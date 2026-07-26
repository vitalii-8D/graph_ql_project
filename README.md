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
- **Comprehensive Test Coverage** for all resolvers and services
- **Input Validation** using class-validator

## Project Structure

```
src/
├── users/
│   ├── entities/user.entity.ts
│   ├── dto/createForPost-user.input.ts
│   ├── dto/update-user.input.ts
│   ├── users.service.ts
│   ├── users.resolver.ts
│   ├── users.resolver.spec.ts
│   └── users.module.ts
├── posts/
│   ├── entities/post.entity.ts
│   ├── dto/createForPost-post.input.ts
│   ├── dto/update-post.input.ts
│   ├── posts.service.ts
│   ├── posts.resolver.ts
│   ├── posts.resolver.spec.ts
│   └── posts.module.ts
├── categories/
│   ├── entities/category.entity.ts
│   └── categories.module.ts
├── open-graph/
│   ├── entities/open-graph-metadata.entity.ts
│   ├── dto/createForPost-open-graph.input.ts
│   ├── dto/update-open-graph.input.ts
│   ├── services/
│   │   ├── open-graph.service.ts
│   │   ├── social-sharing.service.ts
│   │   └── social-sharing.service.spec.ts
│   ├── resolvers/open-graph.resolver.ts
│   ├── types/share-links.type.ts
│   └── open-graph.module.ts
├── database/
│   ├── database.config.ts
│   ├── database.source.ts
│   ├── migrations/
│   │   └── [timestamp]-AddOpenGraphMetadata.ts
│   └── seeds/
│       ├── seeder-with-opengraph.service.ts
│       ├── seeder.module.ts
│       └── seed.ts
└── app.module.ts
```

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
npm run migration:run

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

## Testing

```bash
# unit tests
npm test

# test coverage
npm run test:cov
```

## GraphQL Operations

### User Queries & Mutations

**Create User**

```graphql
mutation {
  createUser(createUserInput: { email: "john@example.com", name: "John Doe", age: 30 }) {
    id
    email
    name
    age
  }
}
```

**Get All Users**

```graphql
query {
  users {
    id
    email
    name
    age
    posts {
      title
    }
  }
}
```

**Get Single User**

```graphql
query {
  user(id: 1) {
    id
    email
    name
    age
  }
}
```

**Update User**

```graphql
mutation {
  updateUser(updateUserInput: { id: 1, name: "Jane Doe", age: 31 }) {
    id
    name
    age
  }
}
```

**Delete User**

```graphql
mutation {
  removeUser(id: 1) {
    id
    name
  }
}
```

### Post Queries & Mutations

**Create Post**

```graphql
mutation {
  createPost(
    createPostInput: {
      title: "My First Post"
      content: "This is the content of my first post"
      published: true
      authorId: 1
      categoryIds: [1, 2]
    }
  ) {
    id
    title
    content
    author {
      name
    }
    categories {
      name
    }
  }
}
```

**Get All Posts**

```graphql
query {
  posts {
    id
    title
    content
    published
    author {
      name
      email
    }
    categories {
      name
    }
    createdAt
    updatedAt
  }
}
```

**Get Single Post**

```graphql
query {
  post(id: 1) {
    id
    title
    content
    published
  }
}
```

**Update Post**

```graphql
mutation {
  updatePost(updatePostInput: { id: 1, title: "Updated Post Title", published: true }) {
    id
    title
    published
  }
}
```

**Delete Post**

```graphql
mutation {
  removePost(id: 1) {
    id
    title
  }
}
```

## Social Sharing & Open Graph Protocol

### Generate Social Media Share Links

```graphql
query {
  generateShareLinks(url: "https://example.com/posts/amazing-post", postId: 1) {
    facebook
    twitter
    linkedin
  }
}
```

### Create OpenGraph Metadata for Rich Sharing

```graphql
mutation {
  createOpenGraphMetadata(
    postId: 1
    createOpenGraphInput: {
      title: "Amazing Blog Post"
      description: "Learn about GraphQL and NestJS in this comprehensive guide"
      type: article
      url: "https://example.com/posts/amazing-post"
      image: "https://example.com/images/preview.jpg"
      imageAlt: "GraphQL tutorial preview image"
      imageWidth: 1200
      imageHeight: 630
      author: "John Doe"
      publisher: "Tech Blog"
      tags: ["GraphQL", "NestJS", "Tutorial"]
      locale: "en_US"
      siteName: "My Tech Blog"
      twitterCard: "summary_large_image"
      twitterSite: "@mytechblog"
      twitterCreator: "@johndoe"
    }
  ) {
    id
    title
    url
    type
  }
}
```

### Get OpenGraph Metadata

```graphql
query {
  openGraphMetadata(id: 1) {
    title
    description
    type
    url
    image
    author
    tags
    post {
      title
    }
  }
}
```

### Generate HTML Meta Tags

```graphql
query {
  generateOpenGraphTags(id: 1, baseUrl: "https://example.com")
}
```

For complete documentation on social sharing features, see [SOCIAL-SHARING.md](SOCIAL-SHARING.md).

For all GraphQL queries and examples, see [social-sharing-queries.md](social-sharing-queries.md).

## Testing Social Sharing

### Quick Start

1. **Start your NestJS app**:
   ```bash
   npm run start:dev
   ```

2. **View the dynamically generated test pages**:
   ```bash
   # Open in browser:
   http://localhost:3000/posts
   ```

   All posts are now dynamically rendered with fresh data from the database using Handlebars templates.

3. **Make it public** for rich social media previews:
   ```bash
   ngrok http 3000
   ```

4. **Test with platform debuggers**:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

### Dynamic Rendering Features

The application now uses **Handlebars template engine** for dynamic page rendering:

- **`/posts`** - Lists all posts with fresh data from the database
- **`/posts/:id`** - Displays individual post with OpenGraph metadata
- All pages include:
  - Dynamic OpenGraph meta tags
  - Social sharing buttons (Facebook, Twitter, LinkedIn)
  - Fresh content loaded from the database on each request
  - Proper HTML escaping and URL encoding

No need to generate static pages anymore - everything is rendered on-demand!

## Database

The project uses SQLite for simplicity. The database file (`database.sqlite`) is automatically created on first run.

- **Type**: SQLite
- **Migrations**: Enabled (use `npm run migration:run` to apply schema changes)
- **Auto-sync**: Disabled (use migrations in production)
- **Logging**: Enabled (SQL queries logged to console)
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
