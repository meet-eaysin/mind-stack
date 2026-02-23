import { Test, type TestingModule } from '@nestjs/testing';
import { INGESTION_STATUS } from '@repo/shared-types';
import { IngestionController } from '../ingestion.controller.js';
import { IngestUrlUseCase } from '../../application/ingest-url.use-case.js';
import { IngestTextUseCase } from '../../application/ingest-text.use-case.js';
import { IngestPdfUseCase } from '../../application/ingest-pdf.use-case.js';
import { IngestYoutubeUseCase } from '../../application/ingest-youtube.use-case.js';
import { RetryIngestionUseCase } from '../../application/retry-ingestion.use-case.js';
import { GetIngestionJobStatusUseCase } from '../../application/get-ingestion-job-status.use-case.js';
import { PrismaDocumentRepository } from '../../infrastructure/prisma-document.repository.js';

describe('IngestionController', () => {
  let controller: IngestionController;

  const mockIngestUrl = { execute: jest.fn() };
  const mockIngestText = { execute: jest.fn() };
  const mockIngestPdf = { execute: jest.fn() };
  const mockIngestYoutube = { execute: jest.fn() };
  const mockRetryIngestion = { execute: jest.fn() };
  const mockGetJobStatus = { execute: jest.fn() };
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
        { provide: PrismaDocumentRepository, useValue: mockDocumentRepository },
      ],
    }).compile();

    controller = moduleFixture.get(IngestionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ingests url/text/pdf/youtube and retries', async () => {
    mockIngestUrl.execute.mockResolvedValue({ documentId: 'u1', jobId: 'j1' });
    mockIngestText.execute.mockResolvedValue({ documentId: 't1', jobId: 'j2' });
    mockIngestPdf.execute.mockResolvedValue({ documentId: 'p1', jobId: 'j3' });
    mockIngestYoutube.execute.mockResolvedValue({
      documentId: 'y1',
      jobId: 'j4',
    });
    mockRetryIngestion.execute.mockResolvedValue({ jobId: 'jr' });

    await expect(
      controller.ingestFromUrl({ url: 'https://example.com' }, 'default'),
    ).resolves.toEqual({
      documentId: 'u1',
      jobId: 'j1',
      status: INGESTION_STATUS.INGESTED,
      message: 'Document ingestion started',
    });

    await expect(
      controller.ingestFromText({ title: 't', content: 'c' }, 'default'),
    ).resolves.toMatchObject({ documentId: 't1' });

    await expect(
      controller.ingestFromPdf({ title: 'p', fileBase64: 'aa' }, 'default'),
    ).resolves.toMatchObject({ documentId: 'p1' });

    await expect(
      controller.ingestFromYoutube(
        {
          url: 'https://youtube.com/watch?v=1',
        },
        'default',
      ),
    ).resolves.toMatchObject({ documentId: 'y1' });

    await expect(controller.retry('doc-1')).resolves.toEqual({
      documentId: 'doc-1',
      jobId: 'jr',
      status: INGESTION_STATUS.INGESTED,
      message: 'Ingestion retry started',
    });
  });

  it('gets job and document status', async () => {
    mockGetJobStatus.execute.mockResolvedValue({
      jobId: 'j1',
      state: 'completed',
    });
    mockDocumentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      status: 'READY',
      learningStatus: 'UPCOMING',
    });

    await expect(controller.getStatus('j1')).resolves.toEqual({
      jobId: 'j1',
      state: 'completed',
    });

    await expect(controller.getDocumentStatus('doc-1')).resolves.toEqual({
      documentId: 'doc-1',
      status: 'READY',
      learningStatus: 'UPCOMING',
    });
  });

  it('throws when document status is requested for unknown document', async () => {
    mockDocumentRepository.findById.mockResolvedValue(null);

    await expect(controller.getDocumentStatus('missing')).rejects.toThrow(
      'Document not found: missing',
    );
  });
});
