import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { IngestionController } from '../ingestion.controller.js';
import { IngestUrlUseCase } from '../../application/ingest-url.use-case.js';
import { IngestTextUseCase } from '../../application/ingest-text.use-case.js';
import { IngestPdfUseCase } from '../../application/ingest-pdf.use-case.js';
import { IngestYoutubeUseCase } from '../../application/ingest-youtube.use-case.js';
import { RetryIngestionUseCase } from '../../application/retry-ingestion.use-case.js';
import { GetIngestionJobStatusUseCase } from '../../application/get-ingestion-job-status.use-case.js';
import { ConfigService } from '@nestjs/config';
import { INGESTION_STATUS } from '@repo/shared-types';
import { PrismaDocumentRepository } from '../../infrastructure/prisma-document.repository.js';

jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: { document: {} },
  })),
}));

jest.mock('@mozilla/readability', () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue({
      title: 'Mocked Title',
      textContent: 'Mocked Content',
    }),
  })),
}));

describe('IngestionController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockIngestUrl = { execute: jest.fn() };
  const mockIngestText = { execute: jest.fn() };
  const mockIngestPdf = { execute: jest.fn() };
  const mockIngestYoutube = { execute: jest.fn() };
  const mockRetryIngestion = { execute: jest.fn() };
  const mockGetJobStatus = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(null) }; // No API key by default
  const mockDocumentRepository = { findById: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: IngestUrlUseCase, useValue: mockIngestUrl },
        { provide: IngestTextUseCase, useValue: mockIngestText },
        { provide: IngestPdfUseCase, useValue: mockIngestPdf },
        { provide: IngestYoutubeUseCase, useValue: mockIngestYoutube },
        { provide: RetryIngestionUseCase, useValue: mockRetryIngestion },
        { provide: GetIngestionJobStatusUseCase, useValue: mockGetJobStatus },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaDocumentRepository, useValue: mockDocumentRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('POST /ingest/url', () => {
    it('should return 201 when valid URL is provided', async () => {
      mockIngestUrl.execute.mockResolvedValue({ documentId: '123' });
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/url')
        .send({ url: 'https://example.com', title: 'Test' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        documentId: '123',
        status: INGESTION_STATUS.INGESTED,
        message: 'Document ingestion started',
      });
    });

    it('should return 400 when URL is invalid', async () => {
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/url')
        .send({ url: 'not-a-url' });

      expect(response.status).toBe(400);
      expect((response.body as { message: string[] }).message).toContain(
        'url must be a URL address',
      );
    });

    it('should return 400 when URL is missing', async () => {
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/url')
        .send({ title: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /ingest/text', () => {
    it('should return 201 when valid text is provided', async () => {
      mockIngestText.execute.mockResolvedValue({ documentId: '456' });
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/text')
        .send({ title: 'My Text', content: 'Some content here' });

      expect(response.status).toBe(201);
      expect((response.body as { documentId: string }).documentId).toBe('456');
    });

    it('should return 400 when content is missing', async () => {
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/text')
        .send({ title: 'My Text' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /ingest/pdf', () => {
    it('should return 201 for valid PDF payload', async () => {
      mockIngestPdf.execute.mockResolvedValue({ documentId: 'pdf-1' });
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/pdf')
        .send({ title: 'Doc', fileBase64: 'YmFzZTY0' });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /ingest/youtube', () => {
    it('should return 201 for valid YouTube URL', async () => {
      mockIngestYoutube.execute.mockResolvedValue({ documentId: 'yt-1' });
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/youtube')
        .send({ url: 'https://youtube.com/watch?v=123' });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /ingest/retry/:documentId', () => {
    it('should return 201 when retrying a valid documentId', async () => {
      mockRetryIngestion.execute.mockResolvedValue({ jobId: 'job-123' });
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/retry/doc-123')
        .send();

      expect(response.status).toBe(201);
      expect((response.body as { documentId: string }).documentId).toBe(
        'doc-123',
      );
    });
  });

  describe('Edge Cases & Errors', () => {
    it('should return 500 if use case throws', async () => {
      mockIngestUrl.execute.mockRejectedValue(new Error('Unexpected error'));
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/url')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(500);
    });

    it('should handle empty payload', async () => {
      const response: SupertestResponse = await request(app.getHttpServer())
        .post('/ingest/url')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
