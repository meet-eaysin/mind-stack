# `@repo/vector-store`

Vector store abstraction and Chroma implementation.

## Responsibility

- Defines vector store contract types.
- Implements Chroma vector store adapter.

## Clean Architecture Layer

- Infrastructure integration package.

## Public Exports

- Types: `VectorStore`, `VectorDocument`, `VectorSearchResult`, `VectorSearchOptions`
- Class: `ChromaVectorStore`

## Runtime or Build-time

- Runtime package.

## Consumption Rules

- Backend/worker should depend on the vector store interface at application boundary.
- Keep vector DB specific behavior isolated to adapter implementation.

## Dependency Rules

- No app module imports.
