import { Injectable } from '@nestjs/common';
import { IngestTextUseCase } from './ingest-text.use-case.js';
import { IngestClipDto } from '../presentation/ingestion.dtos.js';

@Injectable()
export class IngestClipUseCase {
  constructor(private readonly ingestText: IngestTextUseCase) {}

  async execute(dto: IngestClipDto & { userId: string }): Promise<{
    documentId: string;
  }> {
    return this.ingestText.execute({
      title: dto.title,
      content: dto.content,
      sourceUrl: dto.url,
      userId: dto.userId,
    });
  }
}
