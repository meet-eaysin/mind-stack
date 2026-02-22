import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller.js';
import { GetQueueMetricsUseCase } from '../application/get-queue-metrics.use-case.js';
import { CleanupConceptsUseCase } from '../application/cleanup-concepts.use-case.js';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { QueryModule } from '../../query/presentation/query.module.js';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => QueryModule),
    BullModule.registerQueue({
      name: 'ingestion',
    }),
  ],
  controllers: [AdminController],
  providers: [GetQueueMetricsUseCase, CleanupConceptsUseCase],
})
export class AdminModule {}
