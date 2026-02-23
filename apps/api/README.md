# API (`apps/api`)

NestJS backend for Mind Stack.

## Purpose

- Exposes HTTP API under `/api/v1/*` for ingestion, knowledge, query, review, graph, collections, learning goals, settings, export, admin, and analysis.
- Composes clean-architecture modules (`domain`, `application`, `infrastructure`, `presentation`).

## Clean Architecture Role

- Composition boundary for backend modules.
- Controllers orchestrate use-cases.
- Repositories/integrations stay in infrastructure layers.
- Global HTTP concerns (validation, request logging, error filter, correlation id) are centralized in bootstrap/module wiring.

## Runtime Dependencies

- Postgres (`DATABASE_URL`)
- Redis (`REDIS_URL`)
- Chroma (`CHROMA_URL`, `CHROMA_COLLECTION`)
- Ollama (`OLLAMA_BASE_URL`, `OLLAMA_EMBED_MODEL`, `OLLAMA_MODEL`)
- Worker for queue consumption (`apps/worker`)

## Environment Variables

Used by this app via `@repo/config` / Nest `ConfigService`:

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
- `API_KEY` (optional)

## Run Locally

1. Start infra from repo root:

```bash
docker compose up -d
```

2. Push schema (repo root):

```bash
yarn workspace @repo/database db:push
```

3. Start API:

```bash
yarn workspace api dev
```

## Build

```bash
yarn workspace api build
```

## Tests

```bash
yarn workspace api test
yarn workspace api test:e2e
yarn workspace api typecheck
yarn workspace api lint
```

## Debug

```bash
yarn workspace api start:debug
```

## Port

- Default: `4000` (`API_PORT`)

## Integration

- Consumed by `apps/web` through REST endpoints.
- Enqueues ingestion jobs consumed by `apps/worker`.
- Shares contracts via `@repo/shared-types`.
- Uses shared infra libraries: `@repo/config`, `@repo/logger`, `@repo/database`, `@repo/llm`, `@repo/embeddings`, `@repo/vector-store`.
