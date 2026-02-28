import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelProvider,
} from '@repo/shared-types';
import { GetLlmConfigUseCase } from '@/modules/settings/application/get-llm-config.use-case';

type ResolvedConfig = {
  userId: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  encryptedApiKey: string | null;
  enabledCapabilities: Array<
    (typeof MODEL_CAPABILITY)[keyof typeof MODEL_CAPABILITY]
  >;
};

class FakeResolveConfigUseCase {
  public resolved: ResolvedConfig = {
    userId: 'u-1',
    provider: MODEL_PROVIDER.OLLAMA,
    model: 'llama3',
    baseUrl: 'http://localhost:11434',
    encryptedApiKey: null,
    enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  };

  async execute(_userId: string): Promise<ResolvedConfig> {
    return this.resolved;
  }
}

describe('GetLlmConfigUseCase', () => {
  it('maps encryptedApiKey to hasApiKey false when key is missing', async () => {
    const resolve = new FakeResolveConfigUseCase();
    resolve.resolved = {
      userId: 'u-1',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
      encryptedApiKey: null,
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    };

    const useCase = new GetLlmConfigUseCase(resolve);

    await expect(useCase.execute('u-1')).resolves.toEqual({
      userId: 'u-1',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
      hasApiKey: false,
    });
  });

  it('maps encryptedApiKey to hasApiKey true when key exists', async () => {
    const resolve = new FakeResolveConfigUseCase();
    resolve.resolved = {
      userId: 'u-2',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      encryptedApiKey: 'encrypted:sk-live',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
    };

    const useCase = new GetLlmConfigUseCase(resolve);

    await expect(useCase.execute('u-2')).resolves.toEqual({
      userId: 'u-2',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
      hasApiKey: true,
    });
  });
});
