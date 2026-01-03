# GraphQL Project with NestJS

A comprehensive GraphQL API built with NestJS, TypeORM, and SQLite featuring multiple entity relationships and full CRUD operations.

## Features

- **GraphQL API** with Apollo Server
- **TypeORM** integration with SQLite database
- **User Model** with email, name, and age fields
- **One-to-One Relationship**: User ↔ Profile
- **Many-to-Many Relationship**: Post ↔ Category
- **Full CRUD Operations** for Users and Posts via GraphQL resolvers
- **Comprehensive Test Coverage** for all resolvers
- **Input Validation** using class-validator

## Project Structure

```
src/
├── users/
│   ├── entities/user.entity.ts
│   ├── dto/create-user.input.ts
│   ├── dto/update-user.input.ts
│   ├── users.service.ts
│   ├── users.resolver.ts
│   ├── users.resolver.spec.ts
│   └── users.module.ts
├── posts/
│   ├── entities/post.entity.ts
│   ├── dto/create-post.input.ts
│   ├── dto/update-post.input.ts
│   ├── posts.service.ts
│   ├── posts.resolver.ts
│   ├── posts.resolver.spec.ts
│   └── posts.module.ts
├── profiles/
│   └── entities/profile.entity.ts
├── categories/
│   ├── entities/category.entity.ts
│   └── categories.module.ts
├── database/
│   └── database.config.ts
└── app.module.ts
```

## Entity Relationships

### User Entity
- **Fields**: id, email, name, age
- **One-to-One**: User has one Profile
- **One-to-Many**: User has many Posts

### Profile Entity
- **Fields**: id, bio, website, location
- **One-to-One**: Profile belongs to one User

### Post Entity
- **Fields**: id, title, content, published, createdAt, updatedAt
- **Many-to-One**: Post belongs to one User (author)
- **Many-to-Many**: Post can have many Categories

### Category Entity
- **Fields**: id, name, description
- **Many-to-Many**: Category can have many Posts

## Installation

```bash
npm install
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
  createUser(createUserInput: {
    email: "john@example.com"
    name: "John Doe"
    age: 30
  }) {
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
    profile {
      bio
      website
    }
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
  updateUser(updateUserInput: {
    id: 1
    name: "Jane Doe"
    age: 31
  }) {
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
  createPost(createPostInput: {
    title: "My First Post"
    content: "This is the content of my first post"
    published: true
    authorId: 1
    categoryIds: [1, 2]
  }) {
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
  updatePost(updatePostInput: {
    id: 1
    title: "Updated Post Title"
    published: true
  }) {
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

## Database

The project uses SQLite for simplicity. The database file (`database.sqlite`) is automatically created on first run.

- **Type**: SQLite
- **Auto-sync**: Enabled (automatically creates/updates tables)
- **Logging**: Enabled (SQL queries logged to console)

## Technology Stack

- **NestJS** - Progressive Node.js framework
- **GraphQL** - Query language for APIs
- **Apollo Server** - GraphQL server
- **TypeORM** - ORM for TypeScript
- **SQLite** - Lightweight database
- **class-validator** - Decorator-based validation
- **class-transformer** - Object transformation
- **Jest** - Testing framework

## Test Coverage

The project includes comprehensive unit tests for:
- User Resolver (8 test cases)
- Post Resolver (8 test cases)
- All CRUD operations
- Error handling scenarios
- Edge cases

All tests pass successfully with 100% coverage of resolver logic.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
