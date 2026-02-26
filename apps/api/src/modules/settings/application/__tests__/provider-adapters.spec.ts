import { OllamaEmbeddingProvider } from '@repo/embeddings';
import { OpenAILLMProvider } from '@repo/llm';

describe('Provider adapters', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uses /api/embed with input payload for Ollama embeddings', async () => {
    const fetchMock = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ embeddings: [[0.1, 0.2, 0.3]] }), {
        status: 200,
      }),
    );
    global.fetch = fetchMock;

    const provider = new OllamaEmbeddingProvider({
      baseUrl: 'http://localhost:11434',
      model: 'nomic-embed-text',
    });

    const result = await provider.embed('hello world');

    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://localhost:11434/api/embed');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(
      JSON.stringify({ model: 'nomic-embed-text', input: 'hello world' }),
    );
  });

  it('maps OpenAI generation response correctly', async () => {
    const fetchMock = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: 'answer' },
              finish_reason: 'stop',
            },
          ],
          usage: { total_tokens: 12 },
        }),
        { status: 200 },
      ),
    );
    global.fetch = fetchMock;

    const provider = new OpenAILLMProvider({
      baseUrl: 'https://api.openai.com',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
    });

    const result = await provider.generate({ prompt: 'hello' });

    expect(result).toEqual({
      text: 'answer',
      finishReason: 'stop',
      tokenCount: 12,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
  });
});
