import type { QueryRepository } from '../../query/domain/query-repository.interface.js';
import { chunksToMarkdown } from '../domain/export.service.js';

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
