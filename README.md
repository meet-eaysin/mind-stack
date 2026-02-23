# Mind Stack Monorepo

Mind Stack is a Turborepo monorepo for personal knowledge ingestion, retrieval, graph exploration, and spaced review.

## Overview

- `apps/api`: NestJS backend (HTTP API + ingestion processor + clean-architecture modules)
- `apps/web`: Next.js application for the product UI
- `apps/worker`: BullMQ worker for asynchronous ingestion/review jobs
- `apps/docs`: Next.js docs playground app
- `packages/*`: shared runtime libraries and build-time tooling

## Architecture

### Apps and responsibilities

- `api`: composition root for backend modules; orchestrates use-cases, validation, guards, filters, interceptors, and infrastructure adapters.
- `web`: presentation layer for end users; feature-scoped API clients/hooks/components built on React Query.
- `worker`: asynchronous execution boundary for queue jobs (chunking, embedding, concept extraction, daily review, URL extraction).
- `docs`: isolated docs/demo app using shared UI package.

### Shared packages

- `@repo/shared-types`: cross-app domain enums and DTO contracts.
- `@repo/config`: centralized env schema/loader.
- `@repo/logger`: centralized structured logger.
- `@repo/database`: Prisma client package.
- `@repo/llm`, `@repo/embeddings`, `@repo/vector-store`: external service adapters.
- `@repo/eslint-config`, `@repo/typescript-config`: shared build/lint policy.
- `@repo/ui`: shared UI primitives.

## Clean Architecture In This Repo

Backend modules follow `domain` / `application` / `infrastructure` / `presentation` separation:

- `domain`: entities, value rules, repository interfaces.
- `application`: use-cases and orchestration logic.
- `infrastructure`: Prisma repositories, queue adapters, external integrations.
- `presentation`: Nest controllers/modules/DTOs.

Dependency direction stays inward:

- `presentation -> application -> domain`
- `infrastructure -> domain` (implements domain ports)

Frontend keeps data logic in feature API/hook layers and keeps components presentation-focused.

## Monorepo Structure

```text
apps/
  api/
  web/
  worker/
  docs/
packages/
  config/
  database/
  embeddings/
  eslint-config/
  llm/
  logger/
  shared-types/
  typescript-config/
  ui/
  vector-store/
```

## Prerequisites

- Node.js `>= 18`
- Yarn `4.x`
- Docker + Docker Compose

## Environment Configuration

Root `.env` is consumed by backend/worker config via `@repo/config`.

Required server variables:

- `NODE_ENV`
- `DATABASE_URL`
- `API_PORT`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_EMBED_MODEL`
- `CHROMA_URL`
- `CHROMA_COLLECTION`
- `REDIS_URL`
- `LOG_LEVEL`
- `WEB_URL`
- `API_URL`
- `API_KEY` (optional; enables API key guard when set)

Web variable:

- `NEXT_PUBLIC_API_URL` (for `apps/web`, defaults to `http://localhost:4000/api/v1`)

## Local Development Setup

1. Install dependencies:

```bash
yarn install
```

2. Start infrastructure:

```bash
docker compose up -d
```

3. Optional: pull Ollama models defined in `.env`:

```bash
docker compose --profile init-models up ollama-init
```

4. Sync Prisma schema:

```bash
yarn workspace @repo/database db:push
```

## Run Services

Run everything (all workspace `dev` scripts through Turbo):

```bash
yarn dev
```

Run backend only:

```bash
yarn workspace api dev
```

Run web only:

```bash
yarn workspace web dev
```

Run worker/jobs only:

```bash
yarn workspace worker dev
```

Run docs app only:

```bash
yarn workspace docs dev
```

## Build

Build all workspaces:

```bash
yarn build
```

## Testing

All workspaces:

```bash
yarn test
```

Backend only:

```bash
yarn workspace api test
yarn workspace api test:e2e
```

Web only:

```bash
yarn workspace web test
```

## Linting and Typechecking

All workspaces:

```bash
yarn lint
yarn typecheck
```

Targeted examples:

```bash
yarn workspace api typecheck
yarn workspace web lint
yarn workspace worker typecheck
```

## API Response/Error Model

- Success payloads remain endpoint-specific (no global success envelope).
- Error payloads are standardized globally in API filter:
  - `statusCode`
  - `error`
  - `message`
  - `details?` (validation details)
  - `path`
  - `timestamp`
  - `correlationId`

## Swagger

API bootstrap includes centralized Swagger wiring (`DocumentBuilder` + `createDocument`).

If `@nestjs/swagger` is not installed in the environment, the API starts without docs and logs a warning. Install:

```bash
yarn workspace api add @nestjs/swagger swagger-ui-express
```

Then docs are available at:

- `http://localhost:4000/api/docs`

## Troubleshooting

### Ollama/Embedding failures

- Check Ollama container is running:

```bash
docker compose ps
```

- Verify Ollama endpoint from host:

```bash
curl -sS http://localhost:11434/api/tags
```

- Ensure models in `.env` are available (`OLLAMA_EMBED_MODEL`, `OLLAMA_MODEL`).
- If embedding health fails in API, call:
  - `GET /api/v1/admin/health/embedding-model` with `x-user-id` header.

### Queue jobs not progressing

- Confirm Redis is reachable (`REDIS_URL`).
- Confirm worker process is running (`yarn workspace worker dev`).
- Check API and worker logs for `correlationId`, `jobType`, and `documentId`.

### Database issues

- Ensure Postgres container is healthy.
- Re-run schema push:

```bash
yarn workspace @repo/database db:push
```

### Web cannot reach API

- Verify `NEXT_PUBLIC_API_URL` points to `http://localhost:4000/api/v1` (or your target API URL).
- Confirm backend CORS origin (`WEB_URL`) matches web host.
