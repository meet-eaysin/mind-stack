import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { IngestionModule } from './modules/ingestion/presentation/ingestion.module.js';
import { KnowledgeModule } from './modules/knowledge/presentation/knowledge.module.js';
import { QueryModule } from './modules/query/presentation/query.module.js';
import { ReviewModule } from './modules/review/presentation/review.module.js';
import { GraphModule } from './modules/graph/presentation/graph.module.js';
import { ExportModule } from './modules/export/presentation/export.module.js';
import { CollectionModule } from './modules/collection/presentation/collection.module.js';
import { LearningGoalModule } from './modules/learning-goal/presentation/learning-goal.module.js';
import { AdminModule } from './modules/admin/presentation/admin.module.js';
import { AnalysisModule } from './modules/analysis/presentation/analysis.module.js';
import { SettingsModule } from './modules/settings/presentation/settings.module.js';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './common/guards/api-key.guard.js';
import { loadConfig } from '@repo/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    CollectionModule,
    LearningGoalModule,
    AdminModule,
    AnalysisModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
