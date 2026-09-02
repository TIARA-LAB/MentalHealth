# Mental Health API

A NestJS (v11) REST API for mental health applications with JWT-based authentication, refresh-token rotation, and user account management. Uses Prisma (v7) with PostgreSQL.

## Features

- **Auth**: register, login, refresh (with rotation), logout, JWT access + refresh tokens
- **Users**: get/update profile (`/users/me`), change password, soft-delete account
- **Security**: bcrypt-free Argon2 password hashing, rate limiting (Throttler), class-validator DTOs
- **Database**: Prisma ORM, `User` and `RefreshToken` models (soft-deletes via `deletedAt`)
- Global API prefix `/api/v1`, global validation pipe, CORS enabled

## Tech Stack

- NestJS 11, TypeScript 5.7
- Prisma 7 (driver adapter `@prisma/adapter-pg`), PostgreSQL
- Passport + JWT, Argon2, class-validator, Throttler

## Prerequisites

- Node.js 20+ (ESM support)
- Docker (for the database / full stack)

## Setup

### 1. Install dependencies

```bash
$ npm install
```

### 2. Configure environment

```bash
$ cp .env.example .env
```

Edit `.env` and set the `DATABASE_URL`, JWT secrets, and expiration values. The defaults in `.env.example` point to a local PostgreSQL instance.

### 3. Start the database (Docker)

```bash
$ docker compose up -d db
```

### 4. Generate Prisma client and run migrations

```bash
$ npm run prisma:generate
$ npm run prisma:migrate -- --name init
```

> Migration need a running database. In Prisma 7 the schema `datasource.url` is configured in `prisma.config.ts`.

### 5. Seed the database (optional)

```bash
$ npm run prisma:seed
```

Creates an admin user: `admin@example.com` / `password123`.

### 6. Run the app

```bash
# development / watch mode
$ npm run start:dev

# production build
$ npm run build
$ npm run start:prod
```

The API is served at `http://localhost:3000/api/v1`.

## Running with Docker (full stack)

```bash
$ docker compose up --build
```

This starts the PostgreSQL database and the API together.

## Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```

## API

All routes are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Description | Auth |
| ------ | -------- | ----------- | ---- |
| POST | `/auth/register` | Create an account | - |
| POST | `/auth/login` | Sign in (returns access + refresh tokens) | - |
| POST | `/auth/refresh` | Rotate refresh token | Refresh token (Bearer) |
| POST | `/auth/logout` | Revoke refresh tokens | Access token (Bearer) |

### Users

| Method | Endpoint | Description | Auth |
| ------ | -------- | ----------- | ---- |
| GET | `/users/me` | Get current profile | Access token |
| PATCH | `/users/me` | Update profile | Access token |
| PATCH | `/users/me/password` | Change password | Access token |
| DELETE | `/users/me` | Soft-delete account | Access token |

### Auth headers

- Access token: `Authorization: Bearer <accessToken>`
- Refresh token: `Authorization: Bearer <refreshToken>` (for `/auth/refresh`)

### Example: register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Jane"}'
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run build` | Compile the app |
| `npm run start:dev` | Run in watch mode |
| `npm run start:prod` | Run production build |
| `npm run lint` | Lint and fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply local migrations |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── main.ts                  # Bootstrap: prefix, validation pipe, CORS
├── app.module.ts            # Root module (config, throttler, prisma, auth, users)
├── prisma/                  # PrismaModule + PrismaService
├── generated/prisma/        # Generated Prisma client (do not edit)
├── auth/                    # Auth module (DTOs, strategies, guards, decorators)
└── users/                   # Users module (DTOs, controller, service)
prisma/
├── schema.prisma            # User + RefreshToken models
└── seed.ts                  # Seed script
prisma.config.ts             # Prisma 7 config (datasource url, migrations, seed)
```
