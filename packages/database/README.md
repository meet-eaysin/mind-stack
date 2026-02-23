# `@repo/database`

Prisma client package shared by backend and worker.

## Responsibility

- Re-exports `PrismaClient` and `Prisma` from `@prisma/client`.
- Owns Prisma schema and DB utility scripts.

## Clean Architecture Layer

- Infrastructure adapter (persistence boundary).

## Public Exports

- `PrismaClient`
- `Prisma`
- default export: `PrismaClient`

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- Apps should import DB client from `@repo/database` (not duplicate clients).
- Database migrations/schema updates are handled through package scripts.

## Dependency Rules

- Keep ORM/runtime concerns here.
- Domain/application layers should depend on repository interfaces, not Prisma directly.
