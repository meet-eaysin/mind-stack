import { Test, type TestingModule } from '@nestjs/testing';
import { SettingsController } from '@/modules/settings/presentation/settings.controller';
import { GetLlmConfigUseCase } from '@/modules/settings/application/get-llm-config.use-case';
import { UpdateLlmConfigUseCase } from '@/modules/settings/application/update-llm-config.use-case';
import { DeleteLlmConfigUseCase } from '@/modules/settings/application/delete-llm-config.use-case';
import { ResolveLlmConfigUseCase } from '@/modules/settings/application/resolve-llm-config.use-case';
import { MODEL_CAPABILITY, MODEL_PROVIDER } from '@repo/shared-types';

describe('SettingsController', () => {
  let controller: SettingsController;

  const mockGetConfig = { execute: jest.fn() };
  const mockUpdateConfig = { execute: jest.fn() };
  const mockDeleteConfig = { execute: jest.fn() };
  const mockResolveConfig = {
    execute: jest.fn(),
    resolveBaseUrlForProvider: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: GetLlmConfigUseCase, useValue: mockGetConfig },
        { provide: UpdateLlmConfigUseCase, useValue: mockUpdateConfig },
        { provide: DeleteLlmConfigUseCase, useValue: mockDeleteConfig },
        { provide: ResolveLlmConfigUseCase, useValue: mockResolveConfig },
      ],
    }).compile();

    controller = moduleFixture.get(SettingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns wrapped llm config', async () => {
    mockGetConfig.execute.mockResolvedValue({
      userId: 'u-1',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
      hasApiKey: false,
    });

    const result = await controller.getLlmConfig('u-1');

    expect(result.success).toBe(true);
    expect(result.data.provider).toBe(MODEL_PROVIDER.OLLAMA);
  });

  it('updates config with resolved base url', async () => {
    mockResolveConfig.execute.mockResolvedValue({
      userId: 'u-1',
      provider: MODEL_PROVIDER.OLLAMA,
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
      encryptedApiKey: null,
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    });
    mockResolveConfig.resolveBaseUrlForProvider.mockReturnValue(
      'https://api.openai.com',
    );

    mockUpdateConfig.execute.mockResolvedValue({
      userId: 'u-1',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
      hasApiKey: true,
    });

    const result = await controller.updateLlmConfig(
      {
        provider: MODEL_PROVIDER.OPENAI,
        model: 'gpt-4o-mini',
        apiKey: 'sk-test',
        enabledCapabilities: [MODEL_CAPABILITY.CHAT],
      },
      'u-1',
    );

    expect(result.success).toBe(true);
    expect(mockUpdateConfig.execute).toHaveBeenCalledWith('u-1', {
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      apiKey: 'sk-test',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
    });
  });

  it('deletes config', async () => {
    mockDeleteConfig.execute.mockResolvedValue(undefined);

    const result = await controller.deleteLlmConfig('u-1');

    expect(result).toEqual({
      success: true,
      data: { deleted: true },
      meta: { timestamp: expect.any(String) },
    });
  });
});
