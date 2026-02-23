# `@repo/ui`

Shared React UI primitives.

## Responsibility

- Provides reusable UI components for docs/web apps.

## Clean Architecture Layer

- Presentation layer (shared UI).

## Public Exports

- Path exports from `src/*.tsx` via package export map (`./*`).

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- UI apps can import components from `@repo/ui/*`.
- Keep business/data logic out of this package.

## Dependency Rules

- Depends on React only.
- No app-specific API or domain dependencies.
