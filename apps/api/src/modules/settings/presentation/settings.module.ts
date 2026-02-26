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
import { LlmSecretCipher } from '../application/llm-secret-cipher.js';
import { ProviderConfigValidator } from '../application/provider-config-validator.js';
import { DeleteLlmConfigUseCase } from '../application/delete-llm-config.use-case.js';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SettingsController],
  providers: [
    PrismaLlmConfigRepository,
    {
      provide: LlmSecretCipher,
      useFactory: (config: ConfigService) =>
        new LlmSecretCipher(config.get('LLM_CONFIG_ENCRYPTION_KEY')),
      inject: [ConfigService],
    },
    {
      provide: ResolveLlmConfigUseCase,
      useFactory: (repo: PrismaLlmConfigRepository, config: ConfigService) =>
        new ResolveLlmConfigUseCase(repo, config),
      inject: [PrismaLlmConfigRepository, ConfigService],
    },
    {
      provide: ProviderConfigValidator,
      useFactory: () => new ProviderConfigValidator(),
      inject: [],
    },
    {
      provide: LlmProviderFactory,
      useFactory: (
        resolveConfig: ResolveLlmConfigUseCase,
        secretCipher: LlmSecretCipher,
      ) => new LlmProviderFactory(resolveConfig, secretCipher),
      inject: [ResolveLlmConfigUseCase, LlmSecretCipher],
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
        validator: ProviderConfigValidator,
        secretCipher: LlmSecretCipher,
      ) => new UpdateLlmConfigUseCase(repo, validator, secretCipher),
      inject: [
        PrismaLlmConfigRepository,
        ProviderConfigValidator,
        LlmSecretCipher,
      ],
    },
    {
      provide: DeleteLlmConfigUseCase,
      useFactory: (repo: PrismaLlmConfigRepository) =>
        new DeleteLlmConfigUseCase(repo),
      inject: [PrismaLlmConfigRepository],
    },
    {
      provide: CheckEmbeddingModelUseCase,
      useFactory: (
        resolveConfig: ResolveLlmConfigUseCase,
        providerFactory: LlmProviderFactory,
      ) => new CheckEmbeddingModelUseCase(resolveConfig, providerFactory),
      inject: [ResolveLlmConfigUseCase, LlmProviderFactory],
    },
  ],
  exports: [
    ResolveLlmConfigUseCase,
    LlmProviderFactory,
    CheckEmbeddingModelUseCase,
    LlmSecretCipher,
  ],
})
export class SettingsModule {}
