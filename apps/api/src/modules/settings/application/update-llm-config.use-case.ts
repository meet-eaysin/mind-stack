import { BadRequestException } from '@nestjs/common';
import type { LlmConfigRepository } from '../domain/llm-config.repository.interface.js';
import type { ModelProvider } from '@repo/shared-types';
import { MODEL_PROVIDER } from '@repo/shared-types';
import type { UserLlmConfigResponse } from '@repo/shared-types';

export type EmbeddingModelRegistry = {
  hasModel(model: string): Promise<boolean>;
};

export class UpdateLlmConfigUseCase {
  constructor(
    private readonly repository: LlmConfigRepository,
    private readonly modelRegistry: EmbeddingModelRegistry,
  ) {}

  async execute(
    userId: string,
    input: {
      embeddingProvider: ModelProvider;
      embeddingModel: string;
      generationProvider: ModelProvider;
      generationModel: string;
    },
  ): Promise<UserLlmConfigResponse> {
    if (input.embeddingProvider !== MODEL_PROVIDER.OLLAMA) {
      throw new BadRequestException('Unsupported embedding provider');
    }
    if (input.generationProvider !== MODEL_PROVIDER.OLLAMA) {
      throw new BadRequestException('Unsupported generation provider');
    }

    const embedAvailable = await this.modelRegistry.hasModel(
      input.embeddingModel,
    );
    if (!embedAvailable) {
      throw new BadRequestException(
        `Embedding model not available: ${input.embeddingModel}`,
      );
    }

    const generationAvailable = await this.modelRegistry.hasModel(
      input.generationModel,
    );
    if (!generationAvailable) {
      throw new BadRequestException(
        `Generation model not available: ${input.generationModel}`,
      );
    }

    const saved = await this.repository.upsertByUserId(userId, input);
    return {
      userId: saved.userId,
      embeddingProvider: saved.embeddingProvider,
      embeddingModel: saved.embeddingModel,
      generationProvider: saved.generationProvider,
      generationModel: saved.generationModel,
    };
  }
}
