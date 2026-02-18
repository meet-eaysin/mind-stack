import type { QueryRepository } from "../../query/domain/query-repository.interface.js";
import { chunksToNotionBlocks } from "../domain/export.service.js";
import type { NotionBlock } from "@repo/shared-types";

export class ExportNotionUseCase {
  constructor(private readonly queryRepository: QueryRepository) {}

  async execute(chunkIds: string[]): Promise<NotionBlock[]> {
    const chunks = await this.queryRepository.findChunksByIds(chunkIds);

    return chunksToNotionBlocks(
      chunks.map((c) => ({
        content: c.content,
        documentTitle: c.documentTitle,
        tags: c.tags,
      }))
    );
  }
}
