# `@repo/logger`

Shared structured logger built on Pino.

## Responsibility

- Creates structured app loggers with consistent shape and levels.
- Handles dev pretty logging vs production JSON logging.

## Clean Architecture Layer

- Cross-cutting infrastructure package.

## Public Exports

- `createLogger(name)`
- `Logger` type

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- Backend, worker, and infra packages should use this logger for consistency.
- Prefer structured context objects over string-only logs.

## Dependency Rules

- No app/framework imports into logger package.
