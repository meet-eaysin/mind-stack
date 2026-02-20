import { Server } from 'node:http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { INGESTION_QUEUE } from '../../src/modules/ingestion/infrastructure/ingestion-job.producer.js';
import { getQueueToken } from '@nestjs/bullmq';
import {
  EMBEDDING_PROVIDER,
  LLM_PROVIDER,
  VECTOR_STORE,
} from '../../src/common/tokens.js';
import { PrismaQueryRepository } from '../../src/modules/query/infrastructure/prisma-query.repository.js';
import { PrismaReviewRepository } from '../../src/modules/review/infrastructure/prisma-review.repository.js';
import { ChunkingProcessor } from '../../src/modules/ingestion/infrastructure/processors/chunking.processor.js';
import { EmbeddingProcessor } from '../../src/modules/ingestion/infrastructure/processors/embedding.processor.js';
import { ConceptExtractionProcessor } from '../../src/modules/ingestion/infrastructure/processors/concept-extraction.processor.js';
import type { DocumentEntity } from '../../src/modules/ingestion/domain/document.entity.js';
import type { IngestionStatus, SourceType } from '@repo/shared-types';

type MockNote = {
  id: string;
  chunkId: string;
  content: string;
};

jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: { document: {} },
  })),
}));

jest.mock('pdf-parse', () =>
  jest.fn().mockResolvedValue({
    text: 'Mocked PDF Text Output',
    numpages: 1,
    info: { Title: 'Mocked PDF Title' },
  }),
);

jest.mock('@mozilla/readability', () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue({
      title: 'Mocked Title',
      textContent: 'Mocked Content',
    }),
  })),
}));

describe('Feature Flows (e2e)', () => {
  let app: INestApplication<Server>;

  // Mocked state
  const documents: DocumentEntity[] = [];
  const notes: MockNote[] = [];

  const mockPrismaService = {
    document: {
      create: jest
        .fn()
        .mockImplementation((args: { data: Partial<DocumentEntity> }) => {
          const doc: DocumentEntity = {
            id: args.data.id || `doc-${Date.now()}`,
            title: args.data.title || 'Untitled',
            sourceType: args.data.sourceType || ('TEXT' as SourceType),
            sourceUrl: args.data.sourceUrl || null,
            rawContent: args.data.rawContent || '',
            status: args.data.status || ('INGESTED' as IngestionStatus),
            createdAt: new Date(),
          };
          documents.push(doc);
          return Promise.resolve(doc);
        }),
      findMany: jest.fn().mockImplementation(() => Promise.resolve(documents)),
      findUnique: jest
        .fn()
        .mockImplementation((args: { where: { id: string } }) =>
          Promise.resolve(documents.find((d) => d.id === args.where.id)),
        ),
      findFirst: jest
        .fn()
        .mockImplementation((args: { where: { sourceUrl: string } }) =>
          Promise.resolve(
            documents.find((d) => d.sourceUrl === args.where.sourceUrl),
          ),
        ),
      update: jest
        .fn()
        .mockImplementation(
          (args: { where: { id: string }; data: Partial<DocumentEntity> }) => {
            const doc = documents.find((d) => d.id === args.where.id);
            if (doc) Object.assign(doc, args.data);
            return Promise.resolve(doc);
          },
        ),
    },
    chunk: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
    },
    note: {
      create: jest
        .fn()
        .mockImplementation((args: { data: Omit<MockNote, 'id'> }) => {
          const note: MockNote = { id: `note-${Date.now()}`, ...args.data };
          notes.push(note);
          return Promise.resolve(note);
        }),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  const mockEmbeddingProvider = {
    embed: jest.fn().mockResolvedValue({ embedding: [0.1, 0.2] }),
  };
  const mockLLMProvider = {
    generate: jest.fn().mockResolvedValue({ text: 'Mocked response' }),
    generateStream: jest.fn().mockImplementation(async function* () {
      yield { text: 'A' };
      yield { text: 'B' };
    }),
  };
  const mockVectorStore = {
    search: jest.fn().mockResolvedValue([]),
    addChunks: jest.fn(),
  };
  const mockQueryRepo = { findChunksByIds: jest.fn().mockResolvedValue([]) };
  const mockReviewRepo = { findAll: jest.fn().mockResolvedValue([]) };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(getQueueToken(INGESTION_QUEUE))
      .useValue(mockQueue)
      .overrideProvider(EMBEDDING_PROVIDER)
      .useValue(mockEmbeddingProvider)
      .overrideProvider(LLM_PROVIDER)
      .useValue(mockLLMProvider)
      .overrideProvider(VECTOR_STORE)
      .useValue(mockVectorStore)
      .overrideProvider(PrismaQueryRepository)
      .useValue(mockQueryRepo)
      .overrideProvider(PrismaReviewRepository)
      .useValue(mockReviewRepo)
      .overrideProvider(ChunkingProcessor)
      .useValue({ process: jest.fn(), onModuleInit: jest.fn() })
      .overrideProvider(EmbeddingProcessor)
      .useValue({ process: jest.fn(), onModuleInit: jest.fn() })
      .overrideProvider(ConceptExtractionProcessor)
      .useValue({ process: jest.fn(), onModuleInit: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('Flow 1: Ingestion to Knowledge Persistence', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('html', { status: 200 }));
    const ingestRes: SupertestResponse = await request(app.getHttpServer())
      .post('/ingest/url')
      .send({ url: 'https://test.com', title: 'Flow Test' });

    if (ingestRes.status !== 201) {
      console.error('Ingest Error Body:', ingestRes.body);
    }
    expect(ingestRes.status).toBe(201);
    const docId = (ingestRes.body as { documentId: string }).documentId;
    expect(docId).toBeDefined();

    const statusRes: SupertestResponse = await request(app.getHttpServer()).get(
      `/knowledge/documents/${docId}/status`,
    );

    if (statusRes.status !== 200) {
      console.error('Status Error Body:', statusRes.body);
    }
    expect(statusRes.status).toBe(200);

    const listRes: SupertestResponse = await request(app.getHttpServer()).get(
      '/knowledge/documents',
    );
    const body = listRes.body as { documents: DocumentEntity[] };
    expect(body.documents.some((d) => d.id === docId)).toBe(true);
  });

  it('Flow 2: Annotating and Searching', async () => {
    const noteRes: SupertestResponse = await request(app.getHttpServer())
      .post('/knowledge/notes')
      .send({ chunkId: 'c1', content: 'Important note' });

    expect(noteRes.status).toBe(201);
    expect((noteRes.body as { noteId: string }).noteId).toBeDefined();

    const searchRes: SupertestResponse = await request(app.getHttpServer())
      .post('/query/search')
      .send({ query: 'knowledge' });

    if (searchRes.status !== 201) {
      console.error('Search Error Body:', searchRes.body);
    }
    expect(searchRes.status).toBe(201);
  });

  it('Flow 3: Review Generation', async () => {
    const reviewRes: SupertestResponse = await request(app.getHttpServer()).get(
      '/review/daily',
    );
    if (reviewRes.status !== 200) {
      console.error('Review Error Body:', reviewRes.body);
    }
    expect(reviewRes.status).toBe(200);
  });
});
