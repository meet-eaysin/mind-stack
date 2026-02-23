# `@repo/config`

Centralized environment schema and config loading.

## Responsibility

- Defines validated env schemas (`serverEnvSchema`, `webEnvSchema`, `runtimeEnvSchema`).
- Exposes runtime loaders (`loadConfig`, `loadWebConfig`, `loadRuntimeEnv`).

## Clean Architecture Layer

- Cross-cutting infrastructure package.

## Public Exports

- `loadConfig`, `getConfig`, `loadWebConfig`, `loadRuntimeEnv`
- `serverEnvSchema`, `webEnvSchema`, `runtimeEnvSchema`
- `ServerEnv`, `WebEnv`, `RuntimeEnv`, `AppConfig`

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- Apps must read configuration through this package (not direct `process.env`).
- Backend/worker use `loadConfig` or Nest `ConfigService` backed by `serverEnvSchema`.
- Web uses `loadWebConfig` / `loadRuntimeEnv`.

## Dependency Rules

- Keep this package framework-agnostic.
- Do not import app modules into this package.
