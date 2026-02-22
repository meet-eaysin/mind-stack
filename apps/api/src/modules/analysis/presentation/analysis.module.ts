import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller.js';
import { GetTopicMasteryUseCase } from '../application/get-topic-mastery.use-case.js';
import { PrismaModule } from '../../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AnalysisController],
  providers: [GetTopicMasteryUseCase],
})
export class AnalysisModule {}
