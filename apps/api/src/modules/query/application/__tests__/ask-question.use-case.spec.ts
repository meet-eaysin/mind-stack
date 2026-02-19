import { AskQuestionUseCase } from '../ask-question.use-case.js';
import type { SemanticSearchUseCase } from '../semantic-search.use-case.js';
import type {
  LLMProvider,
  GenerationRequest,
  GenerationResponse,
  StreamChunk,
} from '@repo/llm';
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

  execute(_input: { query: string; topK?: number }): Promise<ChunkReference[]> {
    return Promise.resolve(this.results);
  }
}

// ── Tests ──

describe('AskQuestionUseCase', () => {
  let useCase: AskQuestionUseCase;
  let llmProvider: FakeLLMProvider;
  let semanticSearch: FakeSemanticSearchUseCase;

  beforeEach(() => {
    llmProvider = new FakeLLMProvider();
    semanticSearch = new FakeSemanticSearchUseCase();
    useCase = new AskQuestionUseCase(
      llmProvider,
      semanticSearch as unknown as SemanticSearchUseCase,
    );
  });

  it('should return the LLM answer with citations when context is available', async () => {
    const citations = [
      createChunkReferenceFixture({ chunkId: 'c1', content: 'TS is typed' }),
      createChunkReferenceFixture({
        chunkId: 'c2',
        content: 'TS compiles to JS',
      }),
    ];
    semanticSearch.setResults(citations);
    llmProvider.setResponse(
      'TypeScript is a typed language [1] that compiles to JS [2].',
    );

    const result = await useCase.execute({ question: 'What is TypeScript?' });

    expect(result.answer).toBe(
      'TypeScript is a typed language [1] that compiles to JS [2].',
    );
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]?.chunkId).toBe('c1');
    expect(result.citations[1]?.chunkId).toBe('c2');
  });

  it('should return a fallback answer when no citations are found', async () => {
    semanticSearch.setResults([]);

    const result = await useCase.execute({ question: 'Unknown topic?' });

    expect(result.answer).toBe(
      "I don't have enough information to answer this question.",
    );
    expect(result.citations).toHaveLength(0);
  });

  it('should pass the correct topK to semantic search', async () => {
    const executeSpy = jest.spyOn(semanticSearch, 'execute');
    semanticSearch.setResults([]);

    await useCase.execute({ question: 'test', topK: 3 });

    expect(executeSpy).toHaveBeenCalledWith({
      query: 'test',
      topK: 3,
    });
  });

  it('should default topK to 5 when not provided', async () => {
    const executeSpy = jest.spyOn(semanticSearch, 'execute');
    semanticSearch.setResults([]);

    await useCase.execute({ question: 'test' });

    expect(executeSpy).toHaveBeenCalledWith({
      query: 'test',
      topK: 5,
    });
  });

  it('should yield citations then text chunks during streaming', async () => {
    const citations = [createChunkReferenceFixture({ chunkId: 'c1' })];
    semanticSearch.setResults(citations);
    llmProvider.setResponse('Streamed answer');

    const chunks: StreamingAskResponseChunk[] = [];
    for await (const chunk of useCase.executeStream({ question: 'test' })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3); // citations, text, done
    expect(chunks[0]).toEqual({ type: 'citations', data: citations });
    expect(chunks[1]).toEqual({ type: 'text', data: 'Streamed answer' });
    expect(chunks[2]).toEqual({ type: 'done' });
  });
});
