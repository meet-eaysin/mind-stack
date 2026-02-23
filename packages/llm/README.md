# `@repo/llm`

LLM provider abstractions and Ollama implementation.

## Responsibility

- Defines generation/streaming provider contract.
- Implements Ollama LLM provider.

## Clean Architecture Layer

- Infrastructure integration package.

## Public Exports

- Types: `LLMProvider`, `GenerationRequest`, `GenerationResponse`, `StreamChunk`
- Class: `OllamaLLMProvider`

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- Use application factories/use-cases to resolve provider instances.
- Keep endpoint/business orchestration in app layer, not in provider code.

## Dependency Rules

- Vendor-specific API behavior stays inside this package.
