import { Module } from "@nestjs/common";
import { GraphController } from "./graph.controller.js";
import { PrismaConceptRepository } from "../infrastructure/prisma-concept.repository.js";
import { BuildGraphUseCase } from "../application/build-graph.use-case.js";
import { QueryGraphUseCase } from "../application/query-graph.use-case.js";
import { GetNeighborhoodUseCase } from "../application/get-neighborhood.use-case.js";
import { QueryModule } from "../../query/presentation/query.module.js";
import type { LLMProvider } from "@repo/llm";

const LLM_PROVIDER = Symbol("LLMProvider");

@Module({
  imports: [QueryModule],
  controllers: [GraphController],
  providers: [
    PrismaConceptRepository,
    {
      provide: BuildGraphUseCase,
      useFactory: (
        conceptRepo: PrismaConceptRepository,
        llm: LLMProvider
      ) => new BuildGraphUseCase(conceptRepo, llm),
      inject: [PrismaConceptRepository, LLM_PROVIDER],
    },
    {
      provide: QueryGraphUseCase,
      useFactory: (conceptRepo: PrismaConceptRepository) =>
        new QueryGraphUseCase(conceptRepo),
      inject: [PrismaConceptRepository],
    },
    {
      provide: GetNeighborhoodUseCase,
      useFactory: (conceptRepo: PrismaConceptRepository) =>
        new GetNeighborhoodUseCase(conceptRepo),
      inject: [PrismaConceptRepository],
    },
  ],
  exports: [PrismaConceptRepository],
})
export class GraphModule {}
