import { Injectable } from '@nestjs/common';
import { IngestTextUseCase } from '@/modules/ingestion/application/ingest-text.use-case';
import { IngestClipDto } from '@/modules/ingestion/presentation/ingestion.dtos';

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
