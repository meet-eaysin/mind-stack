import type { EmbeddingProvider } from '@repo/embeddings';
import type { VectorStore } from '@repo/vector-store';
import type { QueryRepository } from '../domain/query-repository.interface.js';
import { rankResults } from '../domain/ranking.service.js';
import type { ChunkReference } from '@repo/shared-types';

export class SemanticSearchUseCase {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore,
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(input: {
    query: string;
    topK?: number;
  }): Promise<ChunkReference[]> {
    const topK = input.topK ?? 10;
    const { embedding } = await this.embeddingProvider.embed(input.query);

    const vectorResults = await this.vectorStore.search(embedding, { topK });
    if (vectorResults.length === 0) return [];

    const chunkIds = vectorResults.map((r) => r.id);
    const chunkDetails = await this.queryRepository.findChunksByIds(chunkIds);

    const merged = vectorResults.map((vr) => {
      const detail = chunkDetails.find((d) => d.chunkId === vr.id);
      return {
        chunkId: vr.id,
        content: detail?.content ?? vr.content,
        documentTitle: detail?.documentTitle ?? '',
        vectorScore: vr.score,
        importanceScore: detail?.importanceScore ?? null,
        tags: detail?.tags ?? [],
        createdAt: detail?.createdAt ?? new Date(),
        hasNote: detail?.hasNote ?? false,
        reviewCount: detail?.reviewCount ?? 0,
      };
    });

    const ranked = rankResults(merged);

    const uniqueIds = new Set<string>();
    const uniqueContent = new Set<string>();
    const finalizedRes: ChunkReference[] = [];

    for (const r of ranked) {
      if (uniqueIds.has(r.chunkId)) continue;

      const normalizedContent = r.content
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      if (uniqueContent.has(normalizedContent)) continue;

      uniqueIds.add(r.chunkId);
      uniqueContent.add(normalizedContent);
      finalizedRes.push({
        chunkId: r.chunkId,
        content: r.content,
        documentTitle: r.documentTitle,
        score: r.finalScore,
        tags: r.tags,
      });

      if (finalizedRes.length >= topK) break;
    }

    return finalizedRes;
  }
}
