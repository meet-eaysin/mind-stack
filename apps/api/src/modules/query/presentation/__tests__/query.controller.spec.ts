import { Test, type TestingModule } from '@nestjs/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { QueryController } from '../query.controller.js';
import { SemanticSearchUseCase } from '../../application/semantic-search.use-case.js';
import { FilteredSearchUseCase } from '../../application/filtered-search.use-case.js';
import { AskQuestionUseCase } from '../../application/ask-question.use-case.js';
import { RetrieveChunksUseCase } from '../../application/retrieve-chunks.use-case.js';

describe('QueryController', () => {
  let controller: QueryController;

  const mockSemanticSearch = { execute: jest.fn() };
  const mockFilteredSearch = { execute: jest.fn() };
  const mockAskQuestion = { execute: jest.fn(), executeStream: jest.fn() };
  const mockRetrieveChunks = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [
        { provide: SemanticSearchUseCase, useValue: mockSemanticSearch },
        { provide: FilteredSearchUseCase, useValue: mockFilteredSearch },
        { provide: AskQuestionUseCase, useValue: mockAskQuestion },
        { provide: RetrieveChunksUseCase, useValue: mockRetrieveChunks },
      ],
    }).compile();

    controller = moduleFixture.get(QueryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('search returns document-level aggregated results', async () => {
    mockSemanticSearch.execute.mockResolvedValue([
      {
        chunkId: 'c1',
        documentId: 'd1',
        content: 'alpha',
        documentTitle: 'Doc 1',
        score: 0.6,
        tags: ['a'],
        hasNote: false,
      },
      {
        chunkId: 'c2',
        documentId: 'd1',
        content: 'beta',
        documentTitle: 'Doc 1',
        score: 0.9,
        tags: ['a'],
        hasNote: false,
      },
    ]);

    const result = await controller.search({ query: 'hello' });

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]).toEqual({
      documentId: 'd1',
      title: 'Doc 1',
      author: undefined,
      publishedAt: undefined,
      sourceUrl: null,
      score: 0.9,
      tags: ['a'],
      hasNote: false,
    });
  });

  it('filtered search returns document-level results', async () => {
    mockFilteredSearch.execute.mockResolvedValue([
      {
        chunkId: 'c1',
        documentId: 'd2',
        content: 'gamma',
        documentTitle: 'Doc 2',
        score: 0.8,
        tags: [],
        hasNote: true,
      },
    ]);

    const result = await controller.searchFiltered({ query: 'world' });
    expect(result.documents[0]?.documentId).toBe('d2');
  });

  it('ask and retrieve proxy to use cases', async () => {
    mockAskQuestion.execute.mockResolvedValue({
      answer: 'A',
      citations: [],
      weakContext: true,
    });
    mockRetrieveChunks.execute.mockResolvedValue([]);

    await expect(controller.ask({ question: 'q' })).resolves.toEqual({
      answer: 'A',
      citations: [],
      weakContext: true,
    });
    await expect(controller.retrieve({ query: 'q' })).resolves.toEqual({
      chunks: [],
    });
  });

  it('ask stream emits SSE chunks', async () => {
    async function* stream() {
      yield { type: 'text', data: 'Hello' } as const;
      yield { type: 'done' } as const;
    }

    mockAskQuestion.executeStream.mockReturnValue(stream());

    const events = await firstValueFrom(
      controller.askStream({ question: 'q' }).pipe(take(2), toArray()),
    );

    expect(events[0]?.data).toEqual({ type: 'text', data: 'Hello' });
    expect(events[1]?.data).toEqual({ type: 'done' });
  });
});
