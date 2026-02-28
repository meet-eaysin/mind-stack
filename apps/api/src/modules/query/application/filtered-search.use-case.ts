import type { VectorStore } from '@repo/vector-store';
import type { QueryRepository } from '@/modules/query/domain/query-repository.interface';
import { rankResults } from '@/modules/query/domain/ranking.service';
import type { ChunkReference } from '@repo/shared-types';
import { INGESTION_STATUS } from '@repo/shared-types';
import type { LlmProviderFactoryPort } from '@/modules/settings/application/llm-provider.factory';

export class FilteredSearchUseCase {
  constructor(
    private readonly providerFactory: LlmProviderFactoryPort,
    private readonly vectorStore: VectorStore,
    private readonly queryRepository: QueryRepository,
  ) {}

  async execute(input: {
    query: string;
    tags?: string[];
    fromDate?: string;
    toDate?: string;
    status?: string;
    collectionId?: string;
    conceptId?: string;
    keyword?: string;
    topK?: number;
    userId: string;
  }): Promise<ChunkReference[]> {
    const topK = input.topK ?? 10;
    const embeddingProvider = await this.providerFactory.getEmbeddingProvider(
      input.userId,
    );
    const { embedding } = await embeddingProvider.embed(input.query);

    let allowedChunkIds: Set<string> | undefined;

    const hasFilters =
      (input.tags && input.tags.length > 0) ||
      input.fromDate ||
      input.toDate ||
      input.status ||
      input.collectionId ||
      input.conceptId ||
      input.keyword;

    if (hasFilters) {
      const filters: Parameters<QueryRepository['findChunksByFilters']>[0] = {};

      if (input.tags?.length) filters.tags = input.tags;
      if (input.fromDate) filters.fromDate = new Date(input.fromDate);
      if (input.toDate) filters.toDate = new Date(input.toDate);
      if (input.status) filters.status = input.status;
      if (input.collectionId) filters.collectionId = input.collectionId;
      if (input.conceptId) filters.conceptId = input.conceptId;
      if (input.keyword) filters.keyword = input.keyword;

      const filteredIds =
        await this.queryRepository.findChunksByFilters(filters);
      allowedChunkIds = new Set(filteredIds);
    }

    const vectorResults = await this.vectorStore.search(embedding, {
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
        documentStatus: detail?.documentStatus,
        queryTags: input.tags,
      };
    });

    const readyMerged = merged.filter(
      (item) => item.documentStatus === INGESTION_STATUS.READY,
    );

    const ranked = rankResults(readyMerged);

    const unique = new Map<string, ChunkReference>();
    for (const r of ranked) {
      if (!unique.has(r.chunkId)) {
        unique.set(r.chunkId, {
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
      }
    }

    return Array.from(unique.values()).slice(0, topK);
  }
}
