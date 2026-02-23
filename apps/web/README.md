# Web (`apps/web`)

Next.js App Router frontend for Mind Stack.

## Purpose

- Provides end-user UI for search, documents, ingestion, graph, review, settings, collections, and courses.

## Clean Architecture Role

- Presentation layer for product workflows.
- Feature modules keep API client, schemas, hooks, and components grouped by domain area.
- React Query hooks encapsulate data fetching/mutations; page/components focus on rendering and orchestration.

## Runtime Dependencies

- Mind Stack API (`apps/api`) reachable at `NEXT_PUBLIC_API_URL`

## Environment Variables

- `NEXT_PUBLIC_API_URL` (default parsed by `@repo/config`: `http://localhost:4000/api/v1`)
- `NODE_ENV` (runtime mode)

## Run Locally

```bash
yarn workspace web dev
```

## Build

```bash
yarn workspace web build
```

## Tests

```bash
yarn workspace web test
```

## Lint

```bash
yarn workspace web lint
```

## Debug

- Run dev server and inspect API calls in browser devtools.
- Use Vitest + MSW suites for behavior-level debugging.

## Port

- Default Next.js dev port: `3000`

## Integration

- Calls backend endpoints from `src/constants/endpoints.ts` through centralized `src/lib/api-client.ts`.
- Uses shared enums/contracts from `@repo/shared-types`.
- Uses env/runtime parsing from `@repo/config`.
