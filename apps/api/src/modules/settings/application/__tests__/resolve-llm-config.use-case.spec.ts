import { ConfigService } from '@nestjs/config';
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelProvider,
} from '@repo/shared-types';
import { ResolveLlmConfigUseCase } from '../resolve-llm-config.use-case.js';
import type { LlmConfigRepository } from '../../domain/llm-config.repository.interface.js';
import type { LlmConfigEntity } from '../../domain/llm-config.entity.js';

class FakeLlmConfigRepository implements LlmConfigRepository {
  private configByUserId: Map<string, LlmConfigEntity> = new Map();

  seed(config: LlmConfigEntity): void {
    this.configByUserId.set(config.userId, config);
  }

  async findByUserId(userId: string): Promise<LlmConfigEntity | null> {
    return this.configByUserId.get(userId) ?? null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.configByUserId.delete(userId);
  }

  async upsertByUserId(
    userId: string,
    data: {
      provider: ModelProvider;
      model: string;
      baseUrl: string | null;
      encryptedApiKey: string | null;
      enabledCapabilities: LlmConfigEntity['enabledCapabilities'];
    },
  ): Promise<LlmConfigEntity> {
    const now = new Date();
    const saved: LlmConfigEntity = {
      id: `cfg-${userId}`,
      userId,
      provider: data.provider,
      model: data.model,
      baseUrl: data.baseUrl,
      encryptedApiKey: data.encryptedApiKey,
      enabledCapabilities: data.enabledCapabilities,
      createdAt: now,
      updatedAt: now,
    };
    this.configByUserId.set(userId, saved);
    return saved;
  }
}

describe('ResolveLlmConfigUseCase', () => {
  const originalBaseUrl = process.env['OLLAMA_BASE_URL'];
  const originalModel = process.env['OLLAMA_MODEL'];
  const originalEmbedModel = process.env['OLLAMA_EMBED_MODEL'];

  afterEach(() => {
    process.env['OLLAMA_BASE_URL'] = originalBaseUrl;
    process.env['OLLAMA_MODEL'] = originalModel;
    process.env['OLLAMA_EMBED_MODEL'] = originalEmbedModel;
  });

  it('returns defaults when user has no persisted config', async () => {
    const repo = new FakeLlmConfigRepository();
    process.env['OLLAMA_BASE_URL'] = 'http://localhost:11434';
    process.env['OLLAMA_MODEL'] = 'tinyllama';
    const config = new ConfigService();
    const useCase = new ResolveLlmConfigUseCase(repo, config);

    await expect(useCase.execute('u-1')).resolves.toEqual({
      userId: 'u-1',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'tinyllama',
      baseUrl: 'http://localhost:11434',
      encryptedApiKey: null,
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    });
  });

  it('returns persisted user config when present', async () => {
    const repo = new FakeLlmConfigRepository();
    repo.seed({
      id: 'cfg-u-2',
      userId: 'u-2',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      encryptedApiKey: 'encrypted',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });

    process.env['OLLAMA_BASE_URL'] = 'http://ollama.internal:11434';
    process.env['OLLAMA_MODEL'] = 'tinyllama';
    const config = new ConfigService();
    const useCase = new ResolveLlmConfigUseCase(repo, config);

    await expect(useCase.execute('u-2')).resolves.toEqual({
      userId: 'u-2',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      encryptedApiKey: 'encrypted',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
    });
  });

  it('uses OLLAMA_EMBED_MODEL for embedding fallback when config is missing', async () => {
    const repo = new FakeLlmConfigRepository();
    process.env['OLLAMA_BASE_URL'] = 'http://localhost:11434';
    process.env['OLLAMA_MODEL'] = 'tinyllama';
    process.env['OLLAMA_EMBED_MODEL'] = 'all-minilm';
    const config = new ConfigService();
    const useCase = new ResolveLlmConfigUseCase(repo, config);

    await expect(
      useCase.execute('u-embed', MODEL_CAPABILITY.EMBEDDING),
    ).resolves.toEqual({
      userId: 'u-embed',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'all-minilm',
      baseUrl: 'http://localhost:11434',
      encryptedApiKey: null,
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    });
  });
});
