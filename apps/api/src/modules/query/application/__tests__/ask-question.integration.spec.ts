import { AskQuestionUseCase } from '@/modules/query/application/ask-question.use-case';
import { LlmProviderFactory } from '@/modules/settings/application/llm-provider.factory';
import { MODEL_CAPABILITY, MODEL_PROVIDER } from '@repo/shared-types';

class FakeResolveConfig {
  async execute() {
    return {
      userId: 'u-1',
      provider: MODEL_PROVIDER.OPENAI,
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com',
      encryptedApiKey: 'enc',
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    };
  }
}

class FakeCipher {
  decrypt(_value: string | null): string {
    return 'sk-test';
  }
}

class FakeSemanticSearch {
  async execute() {
    return [
      {
        chunkId: 'c1',
        documentId: 'd1',
        content: 'TypeScript is statically typed.',
        documentTitle: 'TS Guide',
        score: 0.9,
        tags: [],
        hasNote: false,
      },
      {
        chunkId: 'c2',
        documentId: 'd2',
        content: 'TypeScript compiles to JavaScript.',
        documentTitle: 'Compiler docs',
        score: 0.8,
        tags: [],
        hasNote: false,
      },
    ];
  }
}

describe('AskQuestionUseCase integration', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uses resolved user provider config during chat generation', async () => {
    const fetchMock = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'TypeScript is typed [1] and compiles to JS [2].',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { total_tokens: 22 },
        }),
        { status: 200 },
      ),
    );
    global.fetch = fetchMock;

    const providerFactory = new LlmProviderFactory(
      new FakeResolveConfig(),
      new FakeCipher(),
    );

    const useCase = new AskQuestionUseCase(
      providerFactory,
      new FakeSemanticSearch(),
    );

    const result = await useCase.execute({
      question: 'What is TypeScript?',
      userId: 'u-1',
    });

    expect(result.answer).toContain('TypeScript is typed');
    expect(result.citations).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalled();
  });
});
