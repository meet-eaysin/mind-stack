import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "./prisma/prisma.module.js";
import { IngestionModule } from "./modules/ingestion/presentation/ingestion.module.js";
import { KnowledgeModule } from "./modules/knowledge/presentation/knowledge.module.js";
import { QueryModule } from "./modules/query/presentation/query.module.js";
import { ReviewModule } from "./modules/review/presentation/review.module.js";
import { GraphModule } from "./modules/graph/presentation/graph.module.js";
import { ExportModule } from "./modules/export/presentation/export.module.js";
import { loadConfig } from "@repo/config";

@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot({
      connection: {
        url: loadConfig().REDIS_URL,
      },
    }),
    IngestionModule,
    KnowledgeModule,
    QueryModule,
    ReviewModule,
    GraphModule,
    ExportModule,
  ],
})
export class AppModule {}
