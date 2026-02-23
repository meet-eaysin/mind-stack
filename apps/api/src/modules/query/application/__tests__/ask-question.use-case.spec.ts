import { AskQuestionUseCase } from '../ask-question.use-case.js';
import type {
  LLMProvider,
  GenerationRequest,
  GenerationResponse,
  StreamChunk,
} from '@repo/llm';
import type { EmbeddingProvider } from '@repo/embeddings';
import type {
  ChunkReference,
  StreamingAskResponseChunk,
} from '@repo/shared-types';

// ── Fixtures ──

function createChunkReferenceFixture(
  overrides: Partial<ChunkReference> = {},
): ChunkReference {
  return {
    chunkId: 'chunk-1',
    content: 'Some relevant content about TypeScript.',
    documentTitle: 'TypeScript Guide',
    score: 0.95,
    tags: ['typescript'],
    documentId: 'doc-1',
    hasNote: false,
    ...overrides,
  };
}

// ── Fakes ──

class FakeLLMProvider implements LLMProvider {
  private responseText = 'Default LLM response [1]';

  setResponse(text: string): void {
    this.responseText = text;
  }

  generate(_request: GenerationRequest): Promise<GenerationResponse> {
    return Promise.resolve({
      text: this.responseText,
      finishReason: 'stop',
      tokenCount: this.responseText.split(' ').length,
    });
  }

  async *generateStream(
    _request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    await Promise.resolve();
    yield { text: this.responseText, done: true };
  }
}

class FakeSemanticSearchUseCase {
  private results: ChunkReference[] = [];

  setResults(results: ChunkReference[]): void {
    this.results = results;
  }

  execute(_input: {
    query: string;
    topK?: number;
    userId: string;
  }): Promise<ChunkReference[]> {
    return Promise.resolve(this.results);
  }
}

class FakeLlmProviderFactory {
  constructor(private readonly provider: LLMProvider) {}

  async getGenerationProvider(_userId: string): Promise<LLMProvider> {
    return this.provider;
  }

  async getEmbeddingProvider(_userId: string): Promise<EmbeddingProvider> {
    throw new Error('Embedding provider not used in this test');
  }
}

// ── Tests ──

describe('AskQuestionUseCase', () => {
  let useCase: AskQuestionUseCase;
  let llmProvider: FakeLLMProvider;
  let providerFactory: FakeLlmProviderFactory;
  let semanticSearch: FakeSemanticSearchUseCase;

  beforeEach(() => {
    llmProvider = new FakeLLMProvider();
    providerFactory = new FakeLlmProviderFactory(llmProvider);
    semanticSearch = new FakeSemanticSearchUseCase();
    useCase = new AskQuestionUseCase(providerFactory, semanticSearch);
  });

  it('should return the LLM answer with citations when context is available', async () => {
    const citations = [
      createChunkReferenceFixture({
        chunkId: 'c1',
        documentId: 'doc-1',
        content: 'TS is typed',
      }),
      createChunkReferenceFixture({
        chunkId: 'c2',
        documentId: 'doc-2',
        content: 'TS compiles to JS',
      }),
    ];
    semanticSearch.setResults(citations);
    llmProvider.setResponse(
      'TypeScript is a typed language [1] that compiles to JS [2].',
    );

    const result = await useCase.execute({
      question: 'What is TypeScript?',
      userId: 'default',
    });

    expect(result.answer).toBe(
      'TypeScript is a typed language [1] that compiles to JS [2].',
    );
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]?.chunkId).toBe('c1');
    expect(result.citations[1]?.chunkId).toBe('c2');
    expect(result.weakContext).toBe(false);
  });

  it('deduplicates citations by document', async () => {
    const citations = [
      createChunkReferenceFixture({
        chunkId: 'c1',
        documentId: 'doc-1',
        score: 0.6,
      }),
      createChunkReferenceFixture({
        chunkId: 'c2',
        documentId: 'doc-1',
        score: 0.9,
      }),
    ];
    semanticSearch.setResults(citations);
    llmProvider.setResponse('Answer [1]');

    const result = await useCase.execute({
      question: 'TypeScript?',
      userId: 'default',
    });

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.chunkId).toBe('c2');
    expect(result.weakContext).toBe(true);
    expect(result.answer).toContain(
      'Note: Available context is limited; verify critical details.',
    );
  });

  it('should return a fallback answer when no citations are found', async () => {
    semanticSearch.setResults([]);

    const result = await useCase.execute({
      question: 'Unknown topic?',
      userId: 'default',
    });

    expect(result.answer).toBe(
      "I don't have enough information to answer this question.",
    );
    expect(result.citations).toHaveLength(0);
    expect(result.weakContext).toBe(true);
  });

  it('should pass the correct topK to semantic search', async () => {
    const executeSpy = jest.spyOn(semanticSearch, 'execute');
    semanticSearch.setResults([]);

    await useCase.execute({ question: 'test', topK: 3, userId: 'default' });

    expect(executeSpy).toHaveBeenCalledWith({
      query: 'test',
      topK: 3,
      userId: 'default',
    });
  });

  it('should default topK to 5 when not provided', async () => {
    const executeSpy = jest.spyOn(semanticSearch, 'execute');
    semanticSearch.setResults([]);

    await useCase.execute({ question: 'test', userId: 'default' });

    expect(executeSpy).toHaveBeenCalledWith({
      query: 'test',
      topK: 5,
      userId: 'default',
    });
  });

  it('appends source list when answer has no citation markers', async () => {
    semanticSearch.setResults([
      createChunkReferenceFixture({ chunkId: 'c1', documentId: 'doc-1' }),
      createChunkReferenceFixture({ chunkId: 'c2', documentId: 'doc-2' }),
    ]);
    llmProvider.setResponse('TypeScript helps catch errors early.');

    const result = await useCase.execute({
      question: 'Why use TypeScript?',
      userId: 'default',
    });

    expect(result.answer).toContain('Sources: [1], [2]');
  });

  it('falls back when LLM returns empty text', async () => {
    semanticSearch.setResults([
      createChunkReferenceFixture({ chunkId: 'c1', documentId: 'doc-1' }),
    ]);
    llmProvider.setResponse('   ');

    const result = await useCase.execute({
      question: 'Question?',
      userId: 'default',
    });

    expect(result.answer).toContain(
      "I don't have enough information to answer this question.",
    );
  });

  it('should yield citations then text chunks during streaming', async () => {
    const citations = [createChunkReferenceFixture({ chunkId: 'c1' })];
    semanticSearch.setResults(citations);
    llmProvider.setResponse('Streamed answer');

    const chunks: StreamingAskResponseChunk[] = [];
    for await (const chunk of useCase.executeStream({
      question: 'test',
      userId: 'default',
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3); // citations, text, done
    expect(chunks[0]).toEqual({ type: 'citations', data: citations });
    expect(chunks[1]).toEqual({ type: 'text', data: 'Streamed answer' });
    expect(chunks[2]).toEqual({ type: 'done' });
  });
});
