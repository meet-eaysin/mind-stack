import { Controller, Post, Body } from '@nestjs/common';
import { type IngestionResponse, INGESTION_STATUS } from '@repo/shared-types';
import { IngestClipUseCase } from '../application/ingest-clip.use-case.js';
import { IngestClipDto } from './ingestion.dtos.js';

@Controller('ingest')
export class ClipController {
  constructor(private readonly ingestClip: IngestClipUseCase) {}

  @Post('clip')
  async ingestClipText(@Body() dto: IngestClipDto): Promise<IngestionResponse> {
    const result = await this.ingestClip.execute(dto);
    return {
      documentId: result.documentId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Clip ingestion started',
    };
  }
}
