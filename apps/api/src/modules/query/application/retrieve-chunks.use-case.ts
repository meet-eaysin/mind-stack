import type { EmbeddingProvider } from "@repo/embeddings";
import type { VectorStore } from "@repo/vector-store";
import type { QueryRepository } from "../domain/query-repository.interface.js";
import type { ChunkReference } from "@repo/shared-types";

export class RetrieveChunksUseCase {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore,
    private readonly queryRepository: QueryRepository
  ) {}

  async execute(input: {
    query: string;
    topK?: number;
  }): Promise<ChunkReference[]> {
    const topK = input.topK ?? 10;
    const { embedding } = await this.embeddingProvider.embed(input.query);

    const vectorResults = await this.vectorStore.query(embedding, { topK });
    if (vectorResults.length === 0) return [];

    const chunkIds = vectorResults.map((r) => r.id);
    const chunkDetails = await this.queryRepository.findChunksByIds(chunkIds);

    return vectorResults.map((vr) => {
      const detail = chunkDetails.find((d) => d.chunkId === vr.id);
      return {
        chunkId: vr.id,
        content: detail?.content ?? vr.content,
        documentTitle: detail?.documentTitle ?? "",
        score: vr.score,
        tags: detail?.tags ?? [],
      };
    });
  }
}
