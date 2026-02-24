# Packages

This directory contains shared libraries and build-time tooling used across the monorepo.

## Package Catalog

| Package | Responsibility | Type |
| --- | --- | --- |
| `@repo/config` | Centralized env schemas and loaders | Runtime |
| `@repo/database` | Prisma client and schema scripts | Runtime |
| `@repo/embeddings` | Embedding provider interfaces and Ollama adapter | Runtime |
| `@repo/llm` | LLM provider interfaces and Ollama adapter | Runtime |
| `@repo/vector-store` | Vector store interface and Chroma adapter | Runtime |
| `@repo/logger` | Shared structured logging | Runtime |
| `@repo/shared-types` | Cross-app enums and DTO contracts | Runtime/Type |
| `@repo/ui` | Shared React UI primitives | Runtime |
| `@repo/eslint-config` | Shared ESLint presets | Build-time |
| `@repo/typescript-config` | Shared TypeScript presets | Build-time |

## Package README Template

Use this template for any new package under `packages/*/README.md`.

~~~md
# `<package-name>`

Short summary of what this package provides.

## Responsibility

- Primary purpose 1
- Primary purpose 2

## Public API

- Export: `foo`
- Export: `bar`

## Architecture Role

- Layer: `domain | application | infrastructure | presentation | tooling`
- Upstream dependencies allowed:
- Downstream consumers:

## Runtime or Build-time

- `Runtime` or `Build-time`

## Usage

```ts
import { foo } from "<package-name>";
```

## Scripts

```bash
yarn workspace <package-name> build
yarn workspace <package-name> lint
yarn workspace <package-name> typecheck
```

## Dependency Rules

- What this package must not import
- Boundary rules to protect architecture
~~~

## Documentation Conventions

- Keep package READMEs concise and implementation-aware.
- Document only exported APIs, not internal/private files.
- Include boundary rules (what can and cannot depend on the package).
- Update README whenever package exports, scripts, or architectural role changes.
