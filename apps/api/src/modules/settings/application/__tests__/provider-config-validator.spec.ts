import { BadRequestException } from '@nestjs/common';
import { MODEL_CAPABILITY, MODEL_PROVIDER } from '@repo/shared-types';
import { ProviderConfigValidator } from '../provider-config-validator.js';

describe('ProviderConfigValidator', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects empty capability selections', async () => {
    const validator = new ProviderConfigValidator();

    await expect(
      validator.validate({
        provider: MODEL_PROVIDER.OLLAMA,
        model: 'llama3',
        baseUrl: 'http://localhost:11434',
        apiKey: null,
        enabledCapabilities: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns actionable not-found error for Ollama embedding model', async () => {
    const fetchMock = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >();
    fetchMock.mockResolvedValue(
      new Response('model "missing" not found', {
        status: 404,
        statusText: 'Not Found',
      }),
    );
    global.fetch = fetchMock;

    const validator = new ProviderConfigValidator();

    await expect(
      validator.validate({
        provider: MODEL_PROVIDER.OLLAMA,
        model: 'missing',
        baseUrl: 'http://localhost:11434',
        apiKey: null,
        enabledCapabilities: [MODEL_CAPABILITY.EMBEDDING],
      }),
    ).rejects.toThrow("Run 'ollama pull missing'");
  });
});
