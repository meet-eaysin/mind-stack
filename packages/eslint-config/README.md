# `@repo/eslint-config`

Shared ESLint presets for all apps/packages.

## Responsibility

- Defines centralized lint policy for base TypeScript, Next.js apps, and internal React packages.

## Clean Architecture Layer

- Build-time tooling layer.

## Public Exports

- `@repo/eslint-config/base`
- `@repo/eslint-config/next-js`
- `@repo/eslint-config/react-internal`

## Runtime or Build-time

- Build-time only.

## Consumption Rules

- Every app/package should extend one of these presets.
- Do not add local `eslint-disable` suppressions to bypass central rules.

## Dependency Rules

- Keep rule policy centralized here instead of per-app divergence.
