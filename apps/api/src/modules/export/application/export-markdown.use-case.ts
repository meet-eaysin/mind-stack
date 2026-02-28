import type { QueryRepository } from '@/modules/query/domain/query-repository.interface';
import { chunksToMarkdown } from '@/modules/export/domain/export.service';

export class ExportMarkdownUseCase {
  constructor(private readonly queryRepository: QueryRepository) {}

  async execute(chunkIds: string[]): Promise<string> {
    const chunks = await this.queryRepository.findChunksByIds(chunkIds);

    return chunksToMarkdown(
      chunks.map((c) => ({
        content: c.content,
        documentTitle: c.documentTitle,
        tags: c.tags,
      })),
    );
  }
}
