import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { PrismaQueryRepository } from '../infrastructure/prisma-query.repository';
import { SemanticSearchUseCase } from '../application/semantic-search.use-case';
import { FilteredSearchUseCase } from '../application/filtered-search.use-case';
import { AskQuestionUseCase } from '../application/ask-question.use-case';
import { RetrieveChunksUseCase } from '../application/retrieve-chunks.use-case';
import type { VectorStore } from '@repo/vector-store';

import { VECTOR_STORE } from '../../../common/tokens';
import { VectorModule } from '../../../common/vector.module';
import { SettingsModule } from '../../settings/presentation/settings.module';
import { LlmProviderFactory } from '../../settings/application/llm-provider.factory';

@Module({
  imports: [VectorModule, SettingsModule],
  controllers: [QueryController],
  providers: [
    PrismaQueryRepository,
    {
      provide: SemanticSearchUseCase,
      useFactory: (
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
        providerFactory: LlmProviderFactory,
      ) => new SemanticSearchUseCase(providerFactory, vectorStore, queryRepo),
      inject: [VECTOR_STORE, PrismaQueryRepository, LlmProviderFactory],
    },
    {
      provide: FilteredSearchUseCase,
      useFactory: (
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
        providerFactory: LlmProviderFactory,
      ) => new FilteredSearchUseCase(providerFactory, vectorStore, queryRepo),
      inject: [VECTOR_STORE, PrismaQueryRepository, LlmProviderFactory],
    },
    {
      provide: AskQuestionUseCase,
      useFactory: (
        providerFactory: LlmProviderFactory,
        semanticSearch: SemanticSearchUseCase,
      ) => new AskQuestionUseCase(providerFactory, semanticSearch),
      inject: [LlmProviderFactory, SemanticSearchUseCase],
    },
    {
      provide: RetrieveChunksUseCase,
      useFactory: (
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
        providerFactory: LlmProviderFactory,
      ) => new RetrieveChunksUseCase(providerFactory, vectorStore, queryRepo),
      inject: [VECTOR_STORE, PrismaQueryRepository, LlmProviderFactory],
    },
  ],
  exports: [SemanticSearchUseCase, PrismaQueryRepository],
})
export class QueryModule {}
