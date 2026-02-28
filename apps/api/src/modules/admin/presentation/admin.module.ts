import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from '@/modules/admin/presentation/admin.controller';
import { GetQueueMetricsUseCase } from '@/modules/admin/application/get-queue-metrics.use-case';
import { CleanupConceptsUseCase } from '@/modules/admin/application/cleanup-concepts.use-case';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueryModule } from '@/modules/query/presentation/query.module';
import { SettingsModule } from '@/modules/settings/presentation/settings.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => QueryModule),
    SettingsModule,
    BullModule.registerQueue({
      name: 'ingestion',
    }),
  ],
  controllers: [AdminController],
  providers: [GetQueueMetricsUseCase, CleanupConceptsUseCase],
})
export class AdminModule {}
