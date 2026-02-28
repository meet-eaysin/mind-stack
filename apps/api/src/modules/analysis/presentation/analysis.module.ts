import { Module } from '@nestjs/common';
import { AnalysisController } from '@/modules/analysis/presentation/analysis.controller';
import { GetTopicMasteryUseCase } from '@/modules/analysis/application/get-topic-mastery.use-case';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalysisController],
  providers: [GetTopicMasteryUseCase],
})
export class AnalysisModule {}
