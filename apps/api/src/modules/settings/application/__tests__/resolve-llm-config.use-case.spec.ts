import { ConfigService } from '@nestjs/config';
import { MODEL_PROVIDER } from '@repo/shared-types';
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

  async upsertByUserId(
    userId: string,
    data: {
      embeddingProvider: LlmConfigEntity['embeddingProvider'];
      embeddingModel: string;
      generationProvider: LlmConfigEntity['generationProvider'];
      generationModel: string;
    },
  ): Promise<LlmConfigEntity> {
    const now = new Date();
    const saved: LlmConfigEntity = {
      id: `cfg-${userId}`,
      userId,
      embeddingProvider: data.embeddingProvider,
      embeddingModel: data.embeddingModel,
      generationProvider: data.generationProvider,
      generationModel: data.generationModel,
      createdAt: now,
      updatedAt: now,
    };
    this.configByUserId.set(userId, saved);
    return saved;
  }
}

describe('ResolveLlmConfigUseCase', () => {
  const originalBaseUrl = process.env['OLLAMA_BASE_URL'];
  const originalEmbedModel = process.env['OLLAMA_EMBED_MODEL'];
  const originalModel = process.env['OLLAMA_MODEL'];

  afterEach(() => {
    process.env['OLLAMA_BASE_URL'] = originalBaseUrl;
    process.env['OLLAMA_EMBED_MODEL'] = originalEmbedModel;
    process.env['OLLAMA_MODEL'] = originalModel;
  });

  it('returns defaults when user has no persisted config', async () => {
    const repo = new FakeLlmConfigRepository();
    process.env['OLLAMA_BASE_URL'] = 'http://localhost:11434';
    process.env['OLLAMA_EMBED_MODEL'] = 'nomic-embed-text';
    process.env['OLLAMA_MODEL'] = 'tinyllama';
    const config = new ConfigService();
    const useCase = new ResolveLlmConfigUseCase(repo, config);

    await expect(useCase.execute('u-1')).resolves.toEqual({
      userId: 'u-1',
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: 'nomic-embed-text',
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: 'tinyllama',
      baseUrl: 'http://localhost:11434',
    });
  });

  it('returns persisted user config when present', async () => {
    const repo = new FakeLlmConfigRepository();
    repo.seed({
      id: 'cfg-u-2',
      userId: 'u-2',
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: 'mxbai-embed-large',
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: 'llama3.2',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });
    process.env['OLLAMA_BASE_URL'] = 'http://ollama.internal:11434';
    process.env['OLLAMA_EMBED_MODEL'] = 'nomic-embed-text';
    process.env['OLLAMA_MODEL'] = 'tinyllama';
    const config = new ConfigService();
    const useCase = new ResolveLlmConfigUseCase(repo, config);

    await expect(useCase.execute('u-2')).resolves.toEqual({
      userId: 'u-2',
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: 'mxbai-embed-large',
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: 'llama3.2',
      baseUrl: 'http://ollama.internal:11434',
    });
  });
});
