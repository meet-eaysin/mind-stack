import type { VectorStore } from '@repo/vector-store';
import type { QueryRepository } from '../domain/query-repository.interface.js';
import type { ChunkReference } from '@repo/shared-types';
import type { LlmProviderFactoryPort } from '../../settings/application/llm-provider.factory.js';

export class RetrieveChunksUseCase {
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

    return vectorResults.map((vr) => {
      const detail = chunkDetails.find((d) => d.chunkId === vr.id);
      return {
        chunkId: vr.id,
        content: detail?.content ?? vr.content,
        documentTitle: detail?.documentTitle ?? '',
        author: detail?.author ?? undefined,
        publishedAt: detail?.publishedAt?.toISOString() ?? undefined,
        sourceUrl: detail?.sourceUrl ?? null,
        score: vr.score,
        tags: detail?.tags ?? [],
        hasNote: detail?.hasNote ?? false,
        documentId: detail?.documentId ?? '',
      };
    });
  }
}
