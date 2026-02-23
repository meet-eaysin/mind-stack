import { MODEL_PROVIDER } from '@repo/shared-types';
import { CheckEmbeddingModelUseCase } from '../check-embedding-model.use-case.js';

class FakeResolveLlmConfigUseCase {
  private config = {
    userId: 'default',
    embeddingProvider: MODEL_PROVIDER.OLLAMA,
    embeddingModel: 'nomic-embed-text',
    generationProvider: MODEL_PROVIDER.OLLAMA,
    generationModel: 'tinyllama',
    baseUrl: 'http://localhost:11434',
  };

  setConfig(config: {
    userId: string;
    embeddingProvider: (typeof MODEL_PROVIDER)[keyof typeof MODEL_PROVIDER];
    embeddingModel: string;
    generationProvider: (typeof MODEL_PROVIDER)[keyof typeof MODEL_PROVIDER];
    generationModel: string;
    baseUrl: string;
  }): void {
    this.config = config;
  }

  async execute(_userId: string) {
    return this.config;
  }
}

class FakeModelRegistry {
  private availableModels: Set<string> = new Set();

  setAvailable(models: string[]): void {
    this.availableModels = new Set(models);
  }

  async hasModel(model: string): Promise<boolean> {
    return this.availableModels.has(model);
  }
}

describe('CheckEmbeddingModelUseCase', () => {
  it('returns available=true when configured model exists', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    const registry = new FakeModelRegistry();
    registry.setAvailable(['nomic-embed-text']);
    const useCase = new CheckEmbeddingModelUseCase(resolve, registry);

    await expect(useCase.execute('u-1')).resolves.toEqual({
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      available: true,
      reason: undefined,
    });
  });

  it('returns available=false with explicit reason when model is missing', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    resolve.setConfig({
      userId: 'u-2',
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: 'missing-model',
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: 'tinyllama',
      baseUrl: 'http://localhost:11434',
    });
    const registry = new FakeModelRegistry();
    registry.setAvailable([]);
    const useCase = new CheckEmbeddingModelUseCase(resolve, registry);

    await expect(useCase.execute('u-2')).resolves.toEqual({
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'missing-model',
      baseUrl: 'http://localhost:11434',
      available: false,
      reason: 'Embedding model not available: missing-model',
    });
  });
});
