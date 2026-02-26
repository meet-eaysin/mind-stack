import { BadRequestException } from '@nestjs/common';
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelProvider,
} from '@repo/shared-types';
import { UpdateLlmConfigUseCase } from '../update-llm-config.use-case.js';
import type { LlmConfigRepository } from '../../domain/llm-config.repository.interface.js';
import type { LlmConfigEntity } from '../../domain/llm-config.entity.js';

class FakeLlmConfigRepository implements LlmConfigRepository {
  public saved: LlmConfigEntity | null = null;

  async findByUserId(_userId: string): Promise<LlmConfigEntity | null> {
    return this.saved;
  }

  async deleteByUserId(_userId: string): Promise<void> {
    this.saved = null;
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
    const now = new Date('2026-02-23T12:00:00Z');
    const row: LlmConfigEntity = {
      id: 'cfg-1',
      userId,
      provider: data.provider,
      model: data.model,
      baseUrl: data.baseUrl,
      encryptedApiKey: data.encryptedApiKey,
      enabledCapabilities: data.enabledCapabilities,
      createdAt: now,
      updatedAt: now,
    };
    this.saved = row;
    return row;
  }
}

class FakeValidator {
  shouldThrow = false;

  async validate(_input: {
    provider: ModelProvider;
    model: string;
    baseUrl: string;
    apiKey: string | null;
    enabledCapabilities: LlmConfigEntity['enabledCapabilities'];
  }): Promise<void> {
    if (this.shouldThrow) {
      throw new BadRequestException('Invalid provider/model configuration');
    }
  }
}

class FakeCipher {
  encrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    return `encrypted:${value}`;
  }

  decrypt(value: string | null): string | null {
    if (!value) {
      return null;
    }
    return value.replace('encrypted:', '');
  }
}

describe('UpdateLlmConfigUseCase', () => {
  it('saves config when provider validation passes', async () => {
    const repo = new FakeLlmConfigRepository();
    const validator = new FakeValidator();
    const cipher = new FakeCipher();

    const useCase = new UpdateLlmConfigUseCase(repo, validator, cipher);

    await expect(
      useCase.execute('u-1', {
        provider: MODEL_PROVIDER.OPENAI,
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com',
        apiKey: 'sk-test',
        enabledCapabilities: [MODEL_CAPABILITY.CHAT],
      }),
    ).resolves.toEqual({
      userId: 'u-1',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
      hasApiKey: true,
    });
  });

  it('fails when provider validation fails', async () => {
    const repo = new FakeLlmConfigRepository();
    const validator = new FakeValidator();
    validator.shouldThrow = true;
    const cipher = new FakeCipher();

    const useCase = new UpdateLlmConfigUseCase(repo, validator, cipher);

    await expect(
      useCase.execute('u-1', {
        provider: MODEL_PROVIDER.OPENAI,
        model: 'missing-model',
        baseUrl: 'https://api.openai.com',
        apiKey: 'sk-test',
        enabledCapabilities: [MODEL_CAPABILITY.EMBEDDING],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
