import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { PrismaQueryRepository } from '../infrastructure/prisma-query.repository';
import { SemanticSearchUseCase } from '../application/semantic-search.use-case';
import { FilteredSearchUseCase } from '../application/filtered-search.use-case';
import { AskQuestionUseCase } from '../application/ask-question.use-case';
import { RetrieveChunksUseCase } from '../application/retrieve-chunks.use-case';
import { loadConfig } from '@repo/config';
import { OllamaEmbeddingProvider } from '@repo/embeddings';
import { OllamaLLMProvider } from '@repo/llm';
import { ChromaVectorStore } from '@repo/vector-store';
import type { EmbeddingProvider } from '@repo/embeddings';
import type { LLMProvider } from '@repo/llm';
import type { VectorStore } from '@repo/vector-store';

import {
  EMBEDDING_PROVIDER,
  LLM_PROVIDER,
  VECTOR_STORE,
} from '../../../common/tokens.js';

@Module({
  controllers: [QueryController],
  providers: [
    PrismaQueryRepository,
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: () => {
        const config = loadConfig();
        return new OllamaEmbeddingProvider({
          baseUrl: config.OLLAMA_BASE_URL,
          model: config.OLLAMA_EMBED_MODEL,
        });
      },
    },
    {
      provide: LLM_PROVIDER,
      useFactory: () => {
        const config = loadConfig();
        return new OllamaLLMProvider({
          baseUrl: config.OLLAMA_BASE_URL,
          model: config.OLLAMA_MODEL,
        });
      },
    },
    {
      provide: VECTOR_STORE,
      useFactory: () => {
        const config = loadConfig();
        return new ChromaVectorStore(
          config.CHROMA_URL,
          config.CHROMA_COLLECTION,
        );
      },
    },
    {
      provide: SemanticSearchUseCase,
      useFactory: (
        embedding: EmbeddingProvider,
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
      ) => new SemanticSearchUseCase(embedding, vectorStore, queryRepo),
      inject: [EMBEDDING_PROVIDER, VECTOR_STORE, PrismaQueryRepository],
    },
    {
      provide: FilteredSearchUseCase,
      useFactory: (
        embedding: EmbeddingProvider,
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
      ) => new FilteredSearchUseCase(embedding, vectorStore, queryRepo),
      inject: [EMBEDDING_PROVIDER, VECTOR_STORE, PrismaQueryRepository],
    },
    {
      provide: AskQuestionUseCase,
      useFactory: (llm: LLMProvider, semanticSearch: SemanticSearchUseCase) =>
        new AskQuestionUseCase(llm, semanticSearch),
      inject: [LLM_PROVIDER, SemanticSearchUseCase],
    },
    {
      provide: RetrieveChunksUseCase,
      useFactory: (
        embedding: EmbeddingProvider,
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
      ) => new RetrieveChunksUseCase(embedding, vectorStore, queryRepo),
      inject: [EMBEDDING_PROVIDER, VECTOR_STORE, PrismaQueryRepository],
    },
  ],
  exports: [
    SemanticSearchUseCase,
    EMBEDDING_PROVIDER,
    LLM_PROVIDER,
    VECTOR_STORE,
  ],
})
export class QueryModule {}
