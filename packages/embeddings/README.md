# `@repo/embeddings`

Embedding provider abstractions and Ollama implementation.

## Responsibility

- Defines embedding provider contract.
- Implements Ollama embedding provider.
- Provides model registry (`OllamaModelRegistry`).

## Clean Architecture Layer

- Infrastructure integration package.

## Public Exports

- Types: `EmbeddingProvider`, `EmbeddingResult`
- Classes: `OllamaEmbeddingProvider`, `OllamaModelRegistry`

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- Backend/worker should use provider interfaces where possible.
- Provider/model selection should be orchestrated by application-layer factories.

## Dependency Rules

- No app-level module imports.
- Keep vendor-specific HTTP behavior encapsulated in this package.
