# Docs (`apps/docs`)

Next.js docs/playground app in the monorepo.

## Purpose

- Hosts a standalone docs/demo surface.
- Validates shared UI package usage (`@repo/ui`) in a separate app boundary.

## Clean Architecture Role

- Documentation/presentation-only app.
- No backend orchestration or domain logic.

## Runtime Dependencies

- `@repo/ui`
- Next.js runtime

## Environment Variables

- None required by this app currently.

## Run Locally

```bash
yarn workspace docs dev
```

## Build

```bash
yarn workspace docs build
```

## Tests

- No dedicated test script in this app.
- Use lint/typecheck as quality gates.

## Lint and Typecheck

```bash
yarn workspace docs lint
yarn workspace docs typecheck
```

## Debug

- Run `yarn workspace docs dev` and inspect Next.js logs/browser output.

## Port

- Dev port: `3001` (`next dev --port 3001`)

## Integration

- Uses shared UI package from `packages/ui`.
- Does not depend on `apps/api` at runtime.
