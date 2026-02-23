import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { SettingsController } from './settings.controller.js';
import { PrismaLlmConfigRepository } from '../infrastructure/prisma-llm-config.repository.js';
import { ResolveLlmConfigUseCase } from '../application/resolve-llm-config.use-case.js';
import { GetLlmConfigUseCase } from '../application/get-llm-config.use-case.js';
import { UpdateLlmConfigUseCase } from '../application/update-llm-config.use-case.js';
import { CheckEmbeddingModelUseCase } from '../application/check-embedding-model.use-case.js';
import { LlmProviderFactory } from '../application/llm-provider.factory.js';
import { OllamaModelRegistry } from '@repo/embeddings';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SettingsController],
  providers: [
    PrismaLlmConfigRepository,
    {
      provide: OllamaModelRegistry,
      useFactory: (config: ConfigService) =>
        new OllamaModelRegistry(config.getOrThrow('OLLAMA_BASE_URL')),
      inject: [ConfigService],
    },
    {
      provide: ResolveLlmConfigUseCase,
      useFactory: (repo: PrismaLlmConfigRepository, config: ConfigService) =>
        new ResolveLlmConfigUseCase(repo, config),
      inject: [PrismaLlmConfigRepository, ConfigService],
    },
    {
      provide: GetLlmConfigUseCase,
      useFactory: (resolveConfig: ResolveLlmConfigUseCase) =>
        new GetLlmConfigUseCase(resolveConfig),
      inject: [ResolveLlmConfigUseCase],
    },
    {
      provide: UpdateLlmConfigUseCase,
      useFactory: (
        repo: PrismaLlmConfigRepository,
        registry: OllamaModelRegistry,
      ) => new UpdateLlmConfigUseCase(repo, registry),
      inject: [PrismaLlmConfigRepository, OllamaModelRegistry],
    },
    {
      provide: CheckEmbeddingModelUseCase,
      useFactory: (
        resolveConfig: ResolveLlmConfigUseCase,
        registry: OllamaModelRegistry,
      ) => new CheckEmbeddingModelUseCase(resolveConfig, registry),
      inject: [ResolveLlmConfigUseCase, OllamaModelRegistry],
    },
    {
      provide: LlmProviderFactory,
      useFactory: (resolveConfig: ResolveLlmConfigUseCase) =>
        new LlmProviderFactory(resolveConfig),
      inject: [ResolveLlmConfigUseCase],
    },
  ],
  exports: [
    ResolveLlmConfigUseCase,
    LlmProviderFactory,
    CheckEmbeddingModelUseCase,
  ],
})
export class SettingsModule {}
