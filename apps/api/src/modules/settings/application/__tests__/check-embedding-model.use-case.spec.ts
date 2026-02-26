import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from '@repo/shared-types';
import { CheckEmbeddingModelUseCase } from '../check-embedding-model.use-case.js';

class FakeResolveLlmConfigUseCase {
  private config: {
    userId: string;
    provider: ModelProvider;
    model: string;
    baseUrl: string;
    encryptedApiKey: string | null;
    enabledCapabilities: ModelCapability[];
  } = {
    userId: 'default',
    provider: MODEL_PROVIDER.OLLAMA,
    model: 'nomic-embed-text',
    baseUrl: 'http://localhost:11434',
    encryptedApiKey: null,
    enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  };

  setConfig(config: {
    userId: string;
    provider: ModelProvider;
    model: string;
    baseUrl: string;
    encryptedApiKey: string | null;
    enabledCapabilities: ModelCapability[];
  }): void {
    this.config = config;
  }

  async execute(_userId: string) {
    return this.config;
  }
}

class FakeProviderFactory {
  shouldFail = false;

  async getEmbeddingProvider(_userId: string) {
    if (this.shouldFail) {
      throw new Error('Embedding model not available: missing-model');
    }

    return {
      getDimensions: () => 3,
      embed: async () => ({ embedding: [0.1, 0.2, 0.3], dimensions: 3 }),
      embedBatch: async () => [{ embedding: [0.1, 0.2, 0.3], dimensions: 3 }],
    };
  }

  async getGenerationProvider(_userId: string) {
    throw new Error('unused');
  }
}

describe('CheckEmbeddingModelUseCase', () => {
  it('returns available=true when provider embedding probe succeeds', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    const factory = new FakeProviderFactory();
    const useCase = new CheckEmbeddingModelUseCase(resolve, factory);

    await expect(useCase.execute('u-1')).resolves.toEqual({
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      available: true,
    });
  });

  it('returns available=false when embedding capability is disabled', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    resolve.setConfig({
      userId: 'u-2',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      encryptedApiKey: null,
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
    });

    const factory = new FakeProviderFactory();
    const useCase = new CheckEmbeddingModelUseCase(resolve, factory);

    await expect(useCase.execute('u-2')).resolves.toEqual({
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      available: false,
      reason: 'Embedding capability is disabled',
    });
  });

  it('returns available=false with explicit reason when provider probe fails', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    const factory = new FakeProviderFactory();
    factory.shouldFail = true;
    const useCase = new CheckEmbeddingModelUseCase(resolve, factory);

    await expect(useCase.execute('u-2')).resolves.toEqual({
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      available: false,
      reason: 'Embedding model not available: missing-model',
    });
  });
});
