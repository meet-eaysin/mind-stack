# `@repo/typescript-config`

Centralized TypeScript configuration presets.

## Responsibility

- Provides shared TS config baselines for NestJS, Next.js, React libraries, and base strict settings.

## Clean Architecture Layer

- Build-time tooling layer.

## Public Exports

- `./base.json`
- `./nestjs.json`
- `./nextjs.json`
- `./react-library.json`

## Runtime or Build-time

- Build-time only.

## Consumption Rules

- Apps/packages should `extends` one of these presets instead of duplicating compiler policy.

## Dependency Rules

- No runtime code or app imports.
