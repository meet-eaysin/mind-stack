import { Module } from '@nestjs/common';
import { GraphController } from '@/modules/graph/presentation/graph.controller';
import { PrismaConceptRepository } from '@/modules/graph/infrastructure/prisma-concept.repository';
import { BuildGraphUseCase } from '@/modules/graph/application/build-graph.use-case';
import { QueryGraphUseCase } from '@/modules/graph/application/query-graph.use-case';
import { GetNeighborhoodUseCase } from '@/modules/graph/application/get-neighborhood.use-case';
import { CreateRelationUseCase } from '@/modules/graph/application/create-relation.use-case';
import { DeleteRelationUseCase } from '@/modules/graph/application/delete-relation.use-case';
import { QueryModule } from '@/modules/query/presentation/query.module';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import { PrismaChunkRepository } from '@/modules/knowledge/infrastructure/prisma-chunk.repository';

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
