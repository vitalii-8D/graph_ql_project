# Authentication Module Usage

## Overview
The authentication module provides JWT-based authentication with both GraphQL and REST API support.

## Environment Variables
The following environment variables are already configured in `.env`:
- `JWT_SECRET`: Secret key for signing JWT tokens (currently: "jwt_secret")
- `JWT_EXPIRE`: Token expiration time (currently: "60d")

## GraphQL API (Recommended)

### Login Mutation
```graphql
mutation Login($loginInput: LoginInput!) {
  login(loginInput: $loginInput) {
    access_token
    user {
      id
      email
      name
      age
    }
  }
}
```

**Variables:**
```json
{
  "loginInput": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "data": {
    "login": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "1",
        "email": "user@example.com",
        "name": "User Name",
        "age": 25
      }
    }
  }
}
```

## REST API (Alternative)

### Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Using JWT Authentication

To protect routes with JWT authentication, use the `JwtAuthGuard`:

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // { id: 1, email: "user@example.com" }
  }
}
```

## Making Authenticated Requests

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Example with curl:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/protected/profile
```

## Using JWT Guards in GraphQL

To protect GraphQL queries/mutations, use the `@UseGuards()` decorator:

```typescript
import { Resolver, Query, UseGuards } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
export class ProfileResolver {
  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user) {
    return user; // Authenticated user from JWT token
  }
}
```

## Module Structure

```
src/auth/
├── strategies/
│   ├── local.strategy.ts     # Email/password authentication
│   └── jwt.strategy.ts       # JWT token validation with payload
├── guards/
│   ├── local-auth.guard.ts   # Guard for login endpoint
│   └── jwt-auth.guard.ts     # Guard for protected routes
├── types/
│   ├── jwt-payload.type.ts   # JWT payload type definition
│   └── auth-response.type.ts # GraphQL login response type
├── dto/
│   ├── login.dto.ts          # REST login request validation
│   └── login.input.ts        # GraphQL login input type
├── auth.controller.ts        # REST login endpoint
├── auth.resolver.ts          # GraphQL login mutation
├── auth.service.ts           # Authentication logic
└── auth.module.ts            # Module configuration
```

## Security Notes

- **Password Field**: The password field is excluded from all GraphQL queries by removing the `@Field()` decorator from the User entity
- **Password Hashing**: Passwords are hashed using Argon2 with pepper from `PASSWORD_SECRET` environment variable
- **Token Expiration**: JWT tokens expire based on `JWT_EXPIRE` setting (default: 60 days)
- **Input Validation**: All inputs are validated using class-validator decorators
