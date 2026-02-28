import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from '@repo/shared-types';
import { LlmProviderFactory } from '@/modules/settings/application/llm-provider.factory';

class FakeResolveLlmConfigUseCase {
  config: {
    userId: string;
    provider: ModelProvider;
    model: string;
    baseUrl: string;
    encryptedApiKey: string | null;
    enabledCapabilities: ModelCapability[];
  } = {
    userId: 'u-1',
    provider: MODEL_PROVIDER.OLLAMA,
    model: 'llama3',
    baseUrl: 'http://localhost:11434',
    encryptedApiKey: null,
    enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  };

  async execute(): Promise<typeof this.config> {
    return this.config;
  }
}

class FakeCipher {
  decrypt(value: string | null): string | null {
    if (!value) {
      return null;
    }
    return 'decrypted-key';
  }
}

describe('LlmProviderFactory', () => {
  it('creates ollama providers for default config', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    const cipher = new FakeCipher();
    const factory = new LlmProviderFactory(resolve, cipher);

    const llm = await factory.getGenerationProvider('u-1');
    const embed = await factory.getEmbeddingProvider('u-1');

    expect(typeof llm.generate).toBe('function');
    expect(typeof embed.embed).toBe('function');
  });

  it('rejects embedding when capability is disabled', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    resolve.config.enabledCapabilities = [MODEL_CAPABILITY.CHAT];
    const cipher = new FakeCipher();
    const factory = new LlmProviderFactory(resolve, cipher);

    await expect(factory.getEmbeddingProvider('u-1')).rejects.toThrow(
      'Capability EMBEDDING is disabled',
    );
  });

  it('requires api key for non-ollama providers', async () => {
    const resolve = new FakeResolveLlmConfigUseCase();
    resolve.config.provider = MODEL_PROVIDER.OPENAI;
    resolve.config.encryptedApiKey = null;
    const cipher = new FakeCipher();
    const factory = new LlmProviderFactory(resolve, cipher);

    await expect(factory.getGenerationProvider('u-1')).rejects.toThrow(
      'requires an API key',
    );
  });
});
