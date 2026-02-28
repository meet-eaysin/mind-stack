import type { QueryRepository } from '@/modules/query/domain/query-repository.interface';
import { chunksToNotionBlocks } from '@/modules/export/domain/export.service';
import type { NotionBlock } from '@repo/shared-types';

export class ExportNotionUseCase {
  constructor(private readonly queryRepository: QueryRepository) {}

  async execute(chunkIds: string[]): Promise<NotionBlock[]> {
    const chunks = await this.queryRepository.findChunksByIds(chunkIds);

    return chunksToNotionBlocks(
      chunks.map((c) => ({
        content: c.content,
        documentTitle: c.documentTitle,
        tags: c.tags,
      })),
    );
  }
}
