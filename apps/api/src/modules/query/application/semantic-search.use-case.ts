import type { VectorStore } from '@repo/vector-store';
import type { QueryRepository } from '../domain/query-repository.interface.js';
import { rankResults } from '../domain/ranking.service.js';
import { INGESTION_STATUS } from '@repo/shared-types';
import type { ChunkReference } from '@repo/shared-types';
import type { LlmProviderFactoryPort } from '../../settings/application/llm-provider.factory.js';

export class SemanticSearchUseCase {
  constructor(
    private readonly providerFactory: LlmProviderFactoryPort,
    private readonly vectorStore: VectorStore,
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(input: {
    query: string;
    topK?: number;
    userId: string;
  }): Promise<ChunkReference[]> {
    const topK = input.topK ?? 10;
    const embeddingProvider = await this.providerFactory.getEmbeddingProvider(
      input.userId,
    );
    const { embedding } = await embeddingProvider.embed(input.query);

    const vectorResults = await this.vectorStore.search(embedding, { topK });
    if (vectorResults.length === 0) return [];

    const chunkIds = vectorResults.map((r) => r.id);
    const chunkDetails = await this.queryRepository.findChunksByIds(chunkIds);

    // Filter out chunks belonging to documents that are not yet READY
    const readyChunkDetails = chunkDetails.filter(
      (d) => d.documentStatus === INGESTION_STATUS.READY,
    );

    const merged = vectorResults
      .filter((vr) => readyChunkDetails.some((d) => d.chunkId === vr.id))
      .map((vr) => {
        const detail = readyChunkDetails.find((d) => d.chunkId === vr.id)!;
        return {
          chunkId: vr.id,
          documentId: detail?.documentId ?? '',
          content: detail?.content ?? vr.content,
          documentTitle: detail?.documentTitle ?? '',
          author: detail?.author ?? null,
          publishedAt: detail?.publishedAt?.toISOString() ?? null,
          sourceUrl: detail?.sourceUrl ?? null,
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
        documentId: r.documentId,
        content: r.content,
        documentTitle: r.documentTitle,
        author: r.author ?? undefined,
        publishedAt: r.publishedAt ?? undefined,
        sourceUrl: r.sourceUrl ?? null,
        score: r.finalScore,
        tags: r.tags,
        hasNote: r.hasNote,
      });

      if (finalizedRes.length >= topK) break;
    }

    return finalizedRes;
  }
}
