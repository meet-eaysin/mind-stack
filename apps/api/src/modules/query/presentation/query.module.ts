import { Module } from "@nestjs/common";
import { QueryController } from "./query.controller.js";
import { PrismaQueryRepository } from "../infrastructure/prisma-query.repository.js";
import { SemanticSearchUseCase } from "../application/semantic-search.use-case.js";
import { FilteredSearchUseCase } from "../application/filtered-search.use-case.js";
import { AskQuestionUseCase } from "../application/ask-question.use-case.js";
import { RetrieveChunksUseCase } from "../application/retrieve-chunks.use-case.js";
import { loadConfig } from "@repo/config";
import { OllamaEmbeddingProvider } from "@repo/embeddings";
import { OllamaLLMProvider } from "@repo/llm";
import { ChromaVectorStore } from "@repo/vector-store";
import type { EmbeddingProvider } from "@repo/embeddings";
import type { LLMProvider } from "@repo/llm";
import type { VectorStore } from "@repo/vector-store";

const EMBEDDING_PROVIDER = Symbol("EmbeddingProvider");
const LLM_PROVIDER = Symbol("LLMProvider");
const VECTOR_STORE = Symbol("VectorStore");

@Module({
  controllers: [QueryController],
  providers: [
    PrismaQueryRepository,
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: () => {
        const config = loadConfig();
        return new OllamaEmbeddingProvider(
          config.OLLAMA_BASE_URL,
          config.OLLAMA_EMBED_MODEL
        );
      },
    },
    {
      provide: LLM_PROVIDER,
      useFactory: () => {
        const config = loadConfig();
        return new OllamaLLMProvider(
          config.OLLAMA_BASE_URL,
          config.OLLAMA_MODEL
        );
      },
    },
    {
      provide: VECTOR_STORE,
      useFactory: () => {
        const config = loadConfig();
        return new ChromaVectorStore(
          config.CHROMA_URL,
          config.CHROMA_COLLECTION
        );
      },
    },
    {
      provide: SemanticSearchUseCase,
      useFactory: (
        embedding: EmbeddingProvider,
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository
      ) => new SemanticSearchUseCase(embedding, vectorStore, queryRepo),
      inject: [EMBEDDING_PROVIDER, VECTOR_STORE, PrismaQueryRepository],
    },
    {
      provide: FilteredSearchUseCase,
      useFactory: (
        embedding: EmbeddingProvider,
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository
      ) => new FilteredSearchUseCase(embedding, vectorStore, queryRepo),
      inject: [EMBEDDING_PROVIDER, VECTOR_STORE, PrismaQueryRepository],
    },
    {
      provide: AskQuestionUseCase,
      useFactory: (
        llm: LLMProvider,
        semanticSearch: SemanticSearchUseCase
      ) => new AskQuestionUseCase(llm, semanticSearch),
      inject: [LLM_PROVIDER, SemanticSearchUseCase],
    },
    {
      provide: RetrieveChunksUseCase,
      useFactory: (
        embedding: EmbeddingProvider,
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository
      ) => new RetrieveChunksUseCase(embedding, vectorStore, queryRepo),
      inject: [EMBEDDING_PROVIDER, VECTOR_STORE, PrismaQueryRepository],
    },
  ],
  exports: [SemanticSearchUseCase, EMBEDDING_PROVIDER, LLM_PROVIDER, VECTOR_STORE],
})
export class QueryModule {}
