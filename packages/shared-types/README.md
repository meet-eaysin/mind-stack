# `@repo/shared-types`

Shared domain enums and API contract types.

## Responsibility

- Defines canonical enum constants and related TypeScript types.
- Defines shared request/response DTO types across API and web.

## Clean Architecture Layer

- Shared contract layer (domain/application boundary contracts).

## Public Exports

- Enum constants/types: `SOURCE_TYPE`, `INGESTION_STATUS`, `RELATION_TYPE`, `JOB_TYPE`, `LEARNING_STATUS`, `DOCUMENT_TYPE`, `ANNOTATION_TYPE`, `MODEL_PROVIDER`
- DTO and contract types from `src/dto.ts` (including API responses, graph/search/review/collection types)

## Runtime or Build-time

- Runtime-safe type package (primarily compile-time contracts, with runtime enum constant objects).

## Consumption Rules

- Use enums/constants from this package instead of hardcoded domain strings.
- Web/API contract typing should import from this package whenever possible.

## Dependency Rules

- Keep package framework-agnostic.
- No imports from app packages.
