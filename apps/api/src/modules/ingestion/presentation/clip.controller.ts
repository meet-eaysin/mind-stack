import { Controller, Post, Body, Headers } from '@nestjs/common';
import { type IngestionResponse, INGESTION_STATUS } from '@repo/shared-types';
import { IngestClipUseCase } from '@/modules/ingestion/application/ingest-clip.use-case';
import { IngestClipDto } from '@/modules/ingestion/presentation/ingestion.dtos';
import { getUserIdFromHeader } from '@/common/request-user';

@Controller('ingest')
export class ClipController {
  constructor(private readonly ingestClip: IngestClipUseCase) {}

  @Post('clip')
  async ingestClipText(
    @Body() dto: IngestClipDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<IngestionResponse> {
    const result = await this.ingestClip.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    return {
      documentId: result.documentId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Clip ingestion started',
    };
  }
}
