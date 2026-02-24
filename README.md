# Mind Stack

Mind Stack is a production-grade experimental monorepo showcasing modern full-stack architecture, AI-powered ingestion pipelines, and scalable developer workflows.

## Project Purpose

This repository showcases:

- Modular backend design with NestJS and clear architectural boundaries.
- A feature-driven frontend built with Next.js App Router and React Query.
- Shared internal packages for contracts, config, logging, database, and AI integrations.
- Queue-based ingestion and processing workflows.
- Monorepo developer experience with Turborepo + Yarn workspaces.

## Tech Stack

- Monorepo: Turborepo, Yarn 4 workspaces
- Backend: NestJS, BullMQ, Prisma, PostgreSQL, Redis
- AI & Retrieval: Ollama, ChromaDB
- Frontend: Next.js 16, React 19, TanStack Query, Zod, Tailwind CSS
- Tooling: TypeScript, ESLint, Prettier, Jest, Vitest, MSW
- Containers: Docker Compose (infrastructure services)

## High-Level Architecture

```text
apps/web (Next.js UI)
  -> calls apps/api (NestJS REST API)
     -> persists metadata/content in PostgreSQL (Prisma)
     -> queues ingestion jobs in Redis (BullMQ)
     -> reads/writes embeddings in ChromaDB
     -> calls Ollama for embeddings/generation

apps/worker (BullMQ worker)
  -> consumes ingestion jobs
  -> performs chunking, embedding, concept extraction, review jobs

packages/*
  -> shared contracts, infra adapters, and build tooling
```

## Monorepo Structure

```text
apps/
  api/      # NestJS backend API
  web/      # Next.js frontend
  worker/   # BullMQ background worker
  docs/     # docs/demo app (Next.js)
packages/
  config/            # env schemas + loaders
  database/          # Prisma client package
  embeddings/        # embedding provider abstractions
  llm/               # LLM provider abstractions
  vector-store/      # Chroma adapter + vector interface
  logger/            # shared structured logger
  shared-types/      # shared DTO/enums contracts
  ui/                # shared UI primitives
  eslint-config/     # lint presets
  typescript-config/ # tsconfig presets
```

## Workspace Configuration

- Package manager: `yarn@4.12.0`
- Workspace globs: `apps/*`, `packages/*`
- Node linker: `node-modules` (`.yarnrc.yml`)
- Turborepo pipeline: `build`, `dev`, `test`, `lint`, `typecheck`, `clean`

## Turborepo Pipelines

Root scripts:

```bash
yarn dev
yarn build
yarn lint
yarn typecheck
yarn test
yarn clean
```

Pipeline behavior (`turbo.json`):

- `build`: depends on upstream package builds, caches `dist/**` and `.next/**`
- `dev`: non-cached, persistent
- `test`: depends on `^build`
- `lint`/`typecheck`: run across dependency graph
- `globalEnv`: `OLLAMA_BASE_URL`, `OLLAMA_EMBED_MODEL`, `OLLAMA_MODEL`, `NEXT_PUBLIC_API_URL`

## Local Development Setup

1. Install dependencies:

```bash
yarn install
```

2. Create/update root `.env` (see Environment Variables section):

```bash
cp .env.example .env
```

3. Start infrastructure services:

```bash
docker compose up -d --wait
```

4. Sync database schema:

```bash
yarn workspace @repo/database db:push
```

5. Start the monorepo:

```bash
yarn dev
```

Targeted starts:

```bash
yarn workspace api dev
yarn workspace web dev
yarn workspace worker dev
yarn workspace docs dev
```

## Docker and Docker Compose

This repository currently uses Docker Compose for infrastructure dependencies (not for app containers).

Services in `docker-compose.yml`:

- `postgres` on `5432`
- `redis` on `6379`
- `chroma` on `8000`
- `ollama` on `11434`
- `ollama-init` one-shot bootstrap service that auto-pulls required models

Common commands:

```bash
docker compose up -d --wait
docker compose ps
docker compose logs -f postgres redis chroma ollama
docker compose down
```

Docker vs non-Docker workflow:

- Docker-backed: DB, queue, vector DB, and Ollama run in containers.
- Local apps: `apps/api`, `apps/web`, `apps/worker` run via Yarn scripts on host.
- `ollama-init` may appear as `Exited (0)` after successful model pull; this is expected.
- On first run, model pull can take several minutes. Embedding jobs now retry automatically until models are ready.
- Current gap: no `Dockerfile` exists for app-level containerized execution yet.

## Environment Variables

Server/runtime variables (`@repo/config` -> `serverEnvSchema`):

| Variable             | Required | Default                  | Used by                   |
| -------------------- | -------- | ------------------------ | ------------------------- |
| `NODE_ENV`           | No       | `development`            | API, Worker               |
| `DATABASE_URL`       | Yes      | -                        | API, Worker, Prisma       |
| `API_PORT`           | No       | `4000`                   | API                       |
| `OLLAMA_BASE_URL`    | No       | `http://localhost:11434` | API, Worker               |
| `OLLAMA_MODEL`       | Yes      | -                        | API, Worker               |
| `OLLAMA_EMBED_MODEL` | Yes      | -                        | API, Worker               |
| `CHROMA_URL`         | No       | `http://localhost:8000`  | API, Worker               |
| `CHROMA_COLLECTION`  | No       | `mind-stack`             | API, Worker               |
| `REDIS_URL`          | No       | `redis://localhost:6379` | API, Worker               |
| `LOG_LEVEL`          | No       | `info`                   | API, Worker               |
| `WEB_URL`            | No       | `http://localhost:3000`  | API CORS                  |
| `API_URL`            | No       | `http://localhost:4000`  | Internal/shared config    |
| `API_KEY`            | No       | unset                    | API guard (optional auth) |

Web variable (`webEnvSchema`):

| Variable              | Required | Default                        | Used by        |
| --------------------- | -------- | ------------------------------ | -------------- |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:4000/api/v1` | Web API client |

## Backend Architecture (NestJS + Clean Architecture)

The backend modules follow a layered structure:

- `domain`: entities and repository/port interfaces
- `application`: use-cases and orchestration logic
- `infrastructure`: Prisma adapters, queue adapters, external providers
- `presentation`: NestJS controllers, modules, DTOs

Dependency direction:

- `presentation -> application -> domain`
- `infrastructure -> domain` (implements ports)
- Domain never imports presentation or infrastructure.

## Frontend Architecture

`apps/web` uses feature-first organization:

- `src/app`: route-level pages (App Router)
- `src/features/*`: per-domain API clients, hooks, schemas, components
- `src/lib/api-client.ts`: centralized fetch/error handling + Zod validation
- `src/lib/query-client.ts`: React Query defaults and caching policy
- `src/constants/endpoints.ts`: backend route contract surface

## Unified API Response Standard

Current state:

- Error responses are globally standardized in API middleware/filter.
- Success responses are currently inconsistent (`{ success: true }`, resource objects, and `204` empty bodies).

Project standard (to enforce for all new/refactored endpoints):

### Success format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "correlationId": "uuid"
  }
}
```

### Error format

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Document not found",
    "details": []
  },
  "meta": {
    "correlationId": "uuid",
    "timestamp": "2026-02-24T12:00:00.000Z",
    "path": "/api/v1/knowledge/documents/123"
  }
}
```

### Pagination format

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 240,
      "totalPages": 12
    },
    "correlationId": "uuid"
  }
}
```

### Standard error codes

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `EMBEDDING_MODEL_UNAVAILABLE`
- `INGESTION_FAILED`
- `INTERNAL_ERROR`

### HTTP status mapping

| Scenario                    | Status                       |
| --------------------------- | ---------------------------- |
| Successful read             | `200 OK`                     |
| Resource created            | `201 Created`                |
| Async accepted              | `202 Accepted`               |
| Successful update           | `200 OK` or `204 No Content` |
| Successful delete           | `204 No Content`             |
| Validation failure          | `400 Bad Request`            |
| Missing/invalid auth        | `401 Unauthorized`           |
| Authenticated but forbidden | `403 Forbidden`              |
| Resource missing            | `404 Not Found`              |
| Business conflict           | `409 Conflict`               |
| Rate limit reached          | `429 Too Many Requests`      |
| Unexpected server failure   | `500 Internal Server Error`  |

## Testing and Linting

Run across the monorepo:

```bash
yarn test
yarn lint
yarn typecheck
```

Targeted examples:

```bash
yarn workspace api test
yarn workspace api test:e2e
yarn workspace web test
yarn workspace worker lint
```

## Contribution Guidelines

1. Create a feature branch from `main`.
2. Keep changes scoped and atomic.
3. Follow existing architectural boundaries and naming conventions.
4. Add or update tests for behavior changes.
5. Run `yarn lint`, `yarn typecheck`, and relevant tests before opening PR.
6. Update documentation for new modules, endpoints, env vars, or operational changes.

## Roadmap

- Add app-level Dockerfiles and compose profiles for full containerized local development.
- Enforce unified success/pagination envelopes across all API endpoints.
- Standardize REST resource naming for action-style endpoints.
- Add CI workflow docs and architecture decision records (ADRs).

## Clean Code and Architecture Principles

- Keep business rules in use-cases, not controllers.
- Depend on interfaces/ports, not concrete adapters.
- Centralize cross-cutting concerns (config, logging, error handling).
- Prefer explicit DTO/contracts over ad-hoc payloads.
- Preserve strict type safety and schema validation at boundaries.
- Keep modules cohesive and feature-oriented.

## Architecture & Documentation Review Notes

- `docker-compose.yml` currently provisions only dependencies; no app container build workflow exists.  
  Suggested improvement: add Dockerfiles for `apps/api`, `apps/web`, and `apps/worker` with compose profiles for full-stack containerized development.
- API responses are not fully uniform (mix of raw objects, `{ success: true }`, and `204`).  
  Suggested improvement: adopt one response envelope with shared serializers/interceptors.
- Several endpoints use action-style verbs (`/tags/add`, `/notes/update/:id`) instead of resource-first REST patterns.  
  Suggested improvement: migrate to resource-centric routes (`POST /documents/:id/tags`, `PATCH /notes/:id`).
- Ingestion processing exists in both API (`IngestionProcessor`) and dedicated worker app, which can cause operational ambiguity.  
  Suggested improvement: explicitly designate one runtime as the ingestion consumer per environment and document that policy.
- App documentation exists across all apps; depth and operational detail are still uneven.  
  Suggested improvement: keep README sections standardized (setup, env, ports, Docker, troubleshooting) across every app.
