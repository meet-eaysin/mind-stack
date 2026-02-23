import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller.js';
import { PrismaConceptRepository } from '../infrastructure/prisma-concept.repository.js';
import { BuildGraphUseCase } from '../application/build-graph.use-case.js';
import { QueryGraphUseCase } from '../application/query-graph.use-case.js';
import { GetNeighborhoodUseCase } from '../application/get-neighborhood.use-case.js';
import { CreateRelationUseCase } from '../application/create-relation.use-case.js';
import { DeleteRelationUseCase } from '../application/delete-relation.use-case.js';
import { QueryModule } from '../../query/presentation/query.module.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';
import { PrismaChunkRepository } from '../../knowledge/infrastructure/prisma-chunk.repository.js';

@Module({
  imports: [QueryModule],
  controllers: [GraphController],
  providers: [
    PrismaConceptRepository,
    PrismaDocumentRepository,
    PrismaChunkRepository,
    {
      provide: BuildGraphUseCase,
      useFactory: (
        conceptRepo: PrismaConceptRepository,
        documentRepo: PrismaDocumentRepository,
      ) => new BuildGraphUseCase(conceptRepo, documentRepo),
      inject: [PrismaConceptRepository, PrismaDocumentRepository],
    },
    {
      provide: QueryGraphUseCase,
      useFactory: (
        conceptRepo: PrismaConceptRepository,
        documentRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository,
      ) => new QueryGraphUseCase(conceptRepo, documentRepo, chunkRepo),
      inject: [
        PrismaConceptRepository,
        PrismaDocumentRepository,
        PrismaChunkRepository,
      ],
    },
    {
      provide: GetNeighborhoodUseCase,
      useFactory: (
        conceptRepo: PrismaConceptRepository,
        documentRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository,
      ) => new GetNeighborhoodUseCase(conceptRepo, documentRepo, chunkRepo),
      inject: [
        PrismaConceptRepository,
        PrismaDocumentRepository,
        PrismaChunkRepository,
      ],
    },
    {
      provide: CreateRelationUseCase,
      useFactory: (
        conceptRepo: PrismaConceptRepository,
        documentRepo: PrismaDocumentRepository,
      ) => new CreateRelationUseCase(conceptRepo, documentRepo),
      inject: [PrismaConceptRepository, PrismaDocumentRepository],
    },
    {
      provide: DeleteRelationUseCase,
      useFactory: (conceptRepo: PrismaConceptRepository) =>
        new DeleteRelationUseCase(conceptRepo),
      inject: [PrismaConceptRepository],
    },
  ],
  exports: [PrismaConceptRepository, BuildGraphUseCase],
})
export class GraphModule {}
