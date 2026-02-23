import { BadRequestException } from '@nestjs/common';
import { MODEL_PROVIDER } from '@repo/shared-types';
import { UpdateLlmConfigUseCase } from '../update-llm-config.use-case.js';
import type { LlmConfigRepository } from '../../domain/llm-config.repository.interface.js';
import type { LlmConfigEntity } from '../../domain/llm-config.entity.js';

class FakeLlmConfigRepository implements LlmConfigRepository {
  public saved: LlmConfigEntity | null = null;

  async findByUserId(_userId: string): Promise<LlmConfigEntity | null> {
    return this.saved;
  }

  async upsertByUserId(
    userId: string,
    data: {
      embeddingProvider: LlmConfigEntity['embeddingProvider'];
      embeddingModel: string;
      generationProvider: LlmConfigEntity['generationProvider'];
      generationModel: string;
    },
  ): Promise<LlmConfigEntity> {
    const now = new Date('2026-02-23T12:00:00Z');
    const row: LlmConfigEntity = {
      id: 'cfg-1',
      userId,
      embeddingProvider: data.embeddingProvider,
      embeddingModel: data.embeddingModel,
      generationProvider: data.generationProvider,
      generationModel: data.generationModel,
      createdAt: now,
      updatedAt: now,
    };
    this.saved = row;
    return row;
  }
}

class FakeOllamaModelRegistry {
  private available: Set<string> = new Set();

  setAvailable(models: string[]): void {
    this.available = new Set(models);
  }

  async hasModel(model: string): Promise<boolean> {
    return this.available.has(model);
  }
}

describe('UpdateLlmConfigUseCase', () => {
  it('saves config when embedding and generation models exist', async () => {
    const repo = new FakeLlmConfigRepository();
    const registry = new FakeOllamaModelRegistry();
    registry.setAvailable(['nomic-embed-text', 'llama3.2']);

    const useCase = new UpdateLlmConfigUseCase(repo, registry);

    await expect(
      useCase.execute('u-1', {
        embeddingProvider: MODEL_PROVIDER.OLLAMA,
        embeddingModel: 'nomic-embed-text',
        generationProvider: MODEL_PROVIDER.OLLAMA,
        generationModel: 'llama3.2',
      }),
    ).resolves.toEqual({
      userId: 'u-1',
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: 'nomic-embed-text',
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: 'llama3.2',
    });
  });

  it('fails when embedding model is unavailable', async () => {
    const repo = new FakeLlmConfigRepository();
    const registry = new FakeOllamaModelRegistry();
    registry.setAvailable(['llama3.2']);

    const useCase = new UpdateLlmConfigUseCase(repo, registry);

    await expect(
      useCase.execute('u-1', {
        embeddingProvider: MODEL_PROVIDER.OLLAMA,
        embeddingModel: 'missing-embed-model',
        generationProvider: MODEL_PROVIDER.OLLAMA,
        generationModel: 'llama3.2',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('fails when generation model is unavailable', async () => {
    const repo = new FakeLlmConfigRepository();
    const registry = new FakeOllamaModelRegistry();
    registry.setAvailable(['nomic-embed-text']);

    const useCase = new UpdateLlmConfigUseCase(repo, registry);

    await expect(
      useCase.execute('u-1', {
        embeddingProvider: MODEL_PROVIDER.OLLAMA,
        embeddingModel: 'nomic-embed-text',
        generationProvider: MODEL_PROVIDER.OLLAMA,
        generationModel: 'missing-gen-model',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
