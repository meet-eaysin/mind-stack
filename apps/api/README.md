# API (`apps/api`)

NestJS HTTP API for Mind Stack. This app is the backend composition root for ingestion, knowledge retrieval, graph operations, learning workflows, export, and diagnostics.

## Responsibility

- Expose REST endpoints under `/api/v1/*`.
- Orchestrate use-cases and module boundaries.
- Validate requests and standardize error handling.
- Enqueue/track ingestion jobs via BullMQ.
- Connect persistence and AI infrastructure adapters through shared packages.

## Main Technologies

- NestJS 11
- BullMQ (`@nestjs/bullmq`)
- Prisma (`@repo/database`)
- Shared contracts (`@repo/shared-types`)
- Zod config validation (`@repo/config`)
- Structured logging (`@repo/logger`)

## Backend Architecture (Clean Architecture)

Each feature module uses:

- `domain`: entities and repository/port contracts
- `application`: use-cases
- `infrastructure`: Prisma/external adapters
- `presentation`: Nest module/controller/DTO

Dependency rules:

- `presentation -> application -> domain`
- `infrastructure -> domain` (port implementations)
- Domain layer stays framework-agnostic.

Cross-cutting backend concerns are centralized in:

- Global validation pipe
- API key guard (`x-api-key`, optional via `API_KEY`)
- Correlation ID middleware (`x-correlation-id`)
- Global exception filter
- Request logging interceptor

## API Surface (Modules)

- `ingest`
- `knowledge`
- `query`
- `review`
- `graph`
- `export`
- `collections`
- `learning-goals`
- `settings`
- `admin`
- `analysis`

## Environment Variables

| Variable | Required | Default |
| --- | --- | --- |
| `NODE_ENV` | No | `development` |
| `DATABASE_URL` | Yes | - |
| `API_PORT` | No | `4000` |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` |
| `OLLAMA_MODEL` | Yes | - |
| `OLLAMA_EMBED_MODEL` | Yes | - |
| `CHROMA_URL` | No | `http://localhost:8000` |
| `CHROMA_COLLECTION` | No | `mind-stack` |
| `REDIS_URL` | No | `redis://localhost:6379` |
| `LOG_LEVEL` | No | `info` |
| `WEB_URL` | No | `http://localhost:3000` |
| `API_URL` | No | `http://localhost:4000` |
| `API_KEY` | No | unset |

## Local Development

From repository root:

```bash
docker compose up -d --wait
yarn workspace @repo/database db:push
yarn workspace api dev
```

API URL:

- `http://localhost:4000/api/v1`

Swagger (if `@nestjs/swagger` and `swagger-ui-express` are installed):

- `http://localhost:4000/api/docs`

## Docker Usage

Current Docker workflow is dependency-oriented:

- Start infra with `docker compose up -d --wait` (Postgres, Redis, Chroma, Ollama).
- Run API process on host via `yarn workspace api dev`.

Note:

- There is currently no `Dockerfile` for `apps/api`, so full API container execution is not yet defined in this repository.
- First startup may spend time pulling Ollama models; embedding jobs use retry policy to tolerate model warm-up.

## Scripts

```bash
yarn workspace api dev
yarn workspace api build
yarn workspace api start
yarn workspace api start:debug
yarn workspace api test
yarn workspace api test:e2e
yarn workspace api lint
yarn workspace api typecheck
```

## Port

- `API_PORT` (default `4000`)

## API Response Standard

Current implementation:

- Error responses are standardized globally and include status, message, details, path, timestamp, and correlation ID.
- Success responses are not yet consistently enveloped across all endpoints.

Project standard (for all new/refactored endpoints):

- Use a single success envelope (`success`, `data`, `meta`).
- Use typed error codes with consistent HTTP mapping.
- Use uniform pagination metadata for list endpoints.

See root README section `Unified API Response Standard` for the canonical contract.
