# Web (`apps/web`)

Next.js App Router frontend for Mind Stack. This app is responsible for user-facing workflows around ingestion, search, documents, graph exploration, review, collections, and settings.

## Responsibility

- Deliver the primary product UI.
- Integrate with backend API endpoints through a centralized client.
- Organize UI/data logic by feature modules.
- Provide typed runtime validation for API interactions.

## Main Technologies

- Next.js 16 (App Router)
- React 19
- TanStack Query
- Zod
- Tailwind CSS
- Vitest + Testing Library + MSW

## Frontend Structure

```text
src/
  app/                 # route pages
  features/            # domain features (api/hooks/components/schemas/types)
  components/          # shared app-level and UI components
  lib/                 # api client, query client, utilities
  providers/           # app providers (query/theme/tooltip/toasts)
  constants/           # endpoint and query-key constants
  config/              # runtime + env loading
  test/                # msw handlers and test setup
```

## Data Fetching Approach

- Feature APIs call `src/lib/api-client.ts`.
- `api-client` handles:
  - base URL (`NEXT_PUBLIC_API_URL`)
  - typed response parsing with Zod schemas
  - standardized backend error parsing
  - user context header (`x-user-id`)
- React Query handles caching, retry, stale time, and mutation orchestration.

## API Integration Approach

- Endpoint paths are centralized in `src/constants/endpoints.ts`.
- Feature folders keep their own:
  - `api/index.ts`
  - `hooks/index.ts`
  - `schemas/*.schemas.ts`
  - `types/index.ts`
- This keeps each feature internally cohesive and easy to scale.

## Shared Package Usage

- `@repo/config` for environment parsing.
- `@repo/shared-types` for shared enums/contracts.
- Optional shared UI primitives via `@repo/ui` (primarily consumed by `apps/docs`).

## Environment Variables

| Variable | Required | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api/v1` |
| `NODE_ENV` | No | `development` |

## Local Development

From repository root:

```bash
yarn workspace web dev
```

App URL:

- `http://localhost:3000`

## Docker Usage

Current Docker workflow for web is Docker-assisted (dependencies only):

```bash
docker compose up -d
yarn workspace web dev
```

Notes:

- Web runs on host; backend and infrastructure can run locally or with compose.
- No `Dockerfile` currently exists for `apps/web` in this repository.

## Scripts

```bash
yarn workspace web dev
yarn workspace web build
yarn workspace web start
yarn workspace web test
yarn workspace web lint
```

## Port

- Next.js dev server: `3000`
