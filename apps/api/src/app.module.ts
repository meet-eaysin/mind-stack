import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { IngestionModule } from './modules/ingestion/presentation/ingestion.module';
import { KnowledgeModule } from './modules/knowledge/presentation/knowledge.module';
import { QueryModule } from './modules/query/presentation/query.module';
import { ReviewModule } from './modules/review/presentation/review.module';
import { GraphModule } from './modules/graph/presentation/graph.module';
import { ExportModule } from './modules/export/presentation/export.module';
import { CollectionModule } from './modules/collection/presentation/collection.module';
import { LearningGoalModule } from './modules/learning-goal/presentation/learning-goal.module';
import { AdminModule } from './modules/admin/presentation/admin.module';
import { AnalysisModule } from './modules/analysis/presentation/analysis.module';
import { SettingsModule } from './modules/settings/presentation/settings.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { serverEnvSchema } from '@repo/config';
import { RequestContextMiddleware } from './common/http/request-context.middleware';
import { RequestLoggingInterceptor } from './common/http/request-logging.interceptor';
import { GlobalHttpExceptionFilter } from './common/http/global-http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => serverEnvSchema.parse(env),
    }),
    PrismaModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
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
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
