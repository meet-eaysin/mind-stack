import { Test, type TestingModule } from '@nestjs/testing';
import { INGESTION_STATUS } from '@repo/shared-types';
import { ClipController } from '@/modules/ingestion/presentation/clip.controller';
import { IngestClipUseCase } from '@/modules/ingestion/application/ingest-clip.use-case';

describe('ClipController', () => {
  let controller: ClipController;

  const mockIngestClip = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ClipController],
      providers: [{ provide: IngestClipUseCase, useValue: mockIngestClip }],
    }).compile();

    controller = moduleFixture.get(ClipController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ingests clipped text', async () => {
    mockIngestClip.execute.mockResolvedValue({
      documentId: 'clip-doc-1',
    });

    await expect(
      controller.ingestClipText({
        url: 'https://example.com/article',
        title: 'Article clip',
        content: 'selected text',
      }),
    ).resolves.toEqual({
      documentId: 'clip-doc-1',
      status: INGESTION_STATUS.INGESTED,
      message: 'Clip ingestion started',
    });
  });
});
