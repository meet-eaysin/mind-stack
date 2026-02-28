import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { SettingsController } from '@/modules/settings/presentation/settings.controller';
import { PrismaLlmConfigRepository } from '@/modules/settings/infrastructure/prisma-llm-config.repository';
import { ResolveLlmConfigUseCase } from '@/modules/settings/application/resolve-llm-config.use-case';
import { GetLlmConfigUseCase } from '@/modules/settings/application/get-llm-config.use-case';
import { UpdateLlmConfigUseCase } from '@/modules/settings/application/update-llm-config.use-case';
import { CheckEmbeddingModelUseCase } from '@/modules/settings/application/check-embedding-model.use-case';
import { LlmProviderFactory } from '@/modules/settings/application/llm-provider.factory';
import { LlmSecretCipher } from '@/modules/settings/application/llm-secret-cipher';
import { ProviderConfigValidator } from '@/modules/settings/application/provider-config-validator';
import { DeleteLlmConfigUseCase } from '@/modules/settings/application/delete-llm-config.use-case';

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
