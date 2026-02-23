# Worker (`apps/worker`)

BullMQ worker for asynchronous Mind Stack jobs.

## Purpose

- Consumes ingestion queue jobs and executes heavy async processing:
  - URL extraction
  - Chunking
  - Embedding
  - Concept extraction
  - Daily review initialization

## Clean Architecture Role

- Background processing boundary.
- Keeps queue execution out of HTTP request lifecycle.
- Uses shared infra packages (`config`, `logger`, `embeddings`, `llm`, `vector-store`, `database`).

## Runtime Dependencies

- Redis (`REDIS_URL`)
- Postgres (`DATABASE_URL`)
- Chroma (`CHROMA_URL`, `CHROMA_COLLECTION`)
- Ollama (`OLLAMA_BASE_URL`, `OLLAMA_EMBED_MODEL`, `OLLAMA_MODEL`)

## Environment Variables

- `NODE_ENV`
- `DATABASE_URL`
- `REDIS_URL`
- `OLLAMA_BASE_URL`
- `OLLAMA_EMBED_MODEL`
- `OLLAMA_MODEL`
- `CHROMA_URL`
- `CHROMA_COLLECTION`
- `LOG_LEVEL`

## Run Locally

```bash
yarn workspace worker dev
```

## Build

```bash
yarn workspace worker build
```

## Tests

```bash
yarn workspace worker test
```

## Typecheck and Lint

```bash
yarn workspace worker typecheck
yarn workspace worker lint
```

## Debug

- Start worker in watch mode (`dev`) and inspect structured logs.
- Watch for `jobType`, `documentId`, and failure messages to trace pipeline steps.

## Port

- No HTTP port (queue worker process).

## Integration

- Consumes jobs produced by `apps/api` ingestion flow.
- Writes status/data back to Postgres and vector data to Chroma.
