import { Test, type TestingModule } from '@nestjs/testing';
import { INGESTION_STATUS } from '@repo/shared-types';
import { ExportController } from '@/modules/export/presentation/export.controller';
import { ExportMarkdownUseCase } from '@/modules/export/application/export-markdown.use-case';
import { ExportNotionUseCase } from '@/modules/export/application/export-notion.use-case';
import { ExportFullUseCase } from '@/modules/export/application/export-full.use-case';
import { IngestTextUseCase } from '@/modules/ingestion/application/ingest-text.use-case';

describe('ExportController', () => {
  let controller: ExportController;

  const mockExportMarkdown = { execute: jest.fn() };
  const mockExportNotion = { execute: jest.fn() };
  const mockExportFull = { execute: jest.fn() };
  const mockIngestText = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        { provide: ExportMarkdownUseCase, useValue: mockExportMarkdown },
        { provide: ExportNotionUseCase, useValue: mockExportNotion },
        { provide: ExportFullUseCase, useValue: mockExportFull },
        { provide: IngestTextUseCase, useValue: mockIngestText },
      ],
    }).compile();

    controller = moduleFixture.get(ExportController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exports markdown and notion payloads', async () => {
    mockExportMarkdown.execute.mockResolvedValue('# Test Content');
    mockExportNotion.execute.mockResolvedValue([
      { type: 'paragraph', content: 'A', metadata: {} },
    ]);

    await expect(
      controller.toMarkdown({ chunkIds: ['chunk-1', 'chunk-2'] }),
    ).resolves.toEqual({ markdown: '# Test Content' });

    await expect(
      controller.toNotion({ chunkIds: ['chunk-1'] }),
    ).resolves.toEqual({
      payload: [{ type: 'paragraph', content: 'A', metadata: {} }],
    });
  });

  it('exports full snapshot', async () => {
    const payload = {
      version: '1.0.0',
      exportedAt: '2026-02-23T00:00:00.000Z',
      data: {
        documents: [],
        chunks: [],
        concepts: [],
        relations: [],
        notes: [],
        tags: [],
        reviews: [],
        reviewLogs: [],
      },
    };
    mockExportFull.execute.mockResolvedValue(payload);

    await expect(controller.fullExport()).resolves.toEqual(payload);
  });

  it('returns stubbed notion import response', async () => {
    mockIngestText.execute.mockResolvedValue({
      documentId: 'doc-1',
      jobId: 'job-1',
    });

    await expect(
      controller.fromNotionImport({ title: 't', content: 'c' }),
    ).resolves.toEqual({
      documentId: 'doc-1',
      jobId: 'job-1',
      status: INGESTION_STATUS.INGESTED,
      message: 'Notion content ingestion started',
    });
  });

  it('surfaces use-case failures', async () => {
    mockExportMarkdown.execute.mockRejectedValue(new Error('Export failed'));

    await expect(
      controller.toMarkdown({ chunkIds: ['chunk-1'] }),
    ).rejects.toThrow('Export failed');
  });
});
