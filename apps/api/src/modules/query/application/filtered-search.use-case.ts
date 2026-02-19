import type { EmbeddingProvider } from '@repo/embeddings';
import type { VectorStore } from '@repo/vector-store';
import type { QueryRepository } from '../domain/query-repository.interface.js';
import { rankResults } from '../domain/ranking.service.js';
import type { ChunkReference } from '@repo/shared-types';

export class FilteredSearchUseCase {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore,
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(input: {
    query: string;
    tags?: string[];
    fromDate?: string;
    toDate?: string;
    topK?: number;
  }): Promise<ChunkReference[]> {
    const topK = input.topK ?? 10;
    const { embedding } = await this.embeddingProvider.embed(input.query);

    let allowedChunkIds: Set<string> | undefined;

    if (input.tags && input.tags.length > 0) {
      const tagChunkIds = await this.queryRepository.findChunksByTags(
        input.tags,
      );
      allowedChunkIds = new Set(tagChunkIds);
    }

    if (input.fromDate || input.toDate) {
      const from = input.fromDate ? new Date(input.fromDate) : new Date(0);
      const to = input.toDate ? new Date(input.toDate) : new Date();
      const dateChunkIds = await this.queryRepository.findChunksByDateRange(
        from,
        to,
      );
      const dateSet = new Set(dateChunkIds);
      if (allowedChunkIds) {
        allowedChunkIds = new Set(
          [...allowedChunkIds].filter((id) => dateSet.has(id)),
        );
      } else {
        allowedChunkIds = dateSet;
      }
    }

    const vectorResults = await this.vectorStore.query(embedding, {
      topK: topK * 3,
    });

    const filtered = allowedChunkIds
      ? vectorResults.filter((r) => allowedChunkIds.has(r.id))
      : vectorResults;

    const topFiltered = filtered.slice(0, topK);
    if (topFiltered.length === 0) return [];

    const chunkIds = topFiltered.map((r) => r.id);
    const chunkDetails = await this.queryRepository.findChunksByIds(chunkIds);

    const merged = topFiltered.map((vr) => {
      const detail = chunkDetails.find((d) => d.chunkId === vr.id);
      return {
        chunkId: vr.id,
        content: detail?.content ?? vr.content,
        documentTitle: detail?.documentTitle ?? '',
        vectorScore: vr.score,
        importanceScore: detail?.importanceScore ?? null,
        tags: detail?.tags ?? [],
        createdAt: detail?.createdAt ?? new Date(),
        queryTags: input.tags,
      };
    });

    const ranked = rankResults(merged);

    return ranked.map((r) => ({
      chunkId: r.chunkId,
      content: r.content,
      documentTitle: r.documentTitle,
      score: r.finalScore,
      tags: r.tags,
    }));
  }
}
