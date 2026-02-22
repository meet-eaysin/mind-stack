import type { EmbeddingProvider } from '@repo/embeddings';
import type { VectorStore, VectorSearchResult } from '@repo/vector-store';
import type { QueryRepository } from '../../query/domain/query-repository.interface.js';
import type { ChunkRepository } from '../domain/chunk-repository.interface.js';
import type { ChunkReference } from '@repo/shared-types';

export class GetRelatedSuggestionsUseCase {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore,
    private readonly queryRepository: QueryRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async execute(documentId: string): Promise<ChunkReference[]> {
    // 1. Get chunks for the document
    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    if (chunks.length === 0) return [];

    // 2. Use the first few chunks to find related content
    const seedChunks = chunks.slice(0, 3);
    const allRelatedResults: VectorSearchResult[] = [];
    const seenDocumentIds = new Set<string>([documentId]);

    for (const chunk of seedChunks) {
      const { embedding } = await this.embeddingProvider.embed(chunk.content);
      const results = await this.vectorStore.search(embedding, { topK: 5 });

      for (const res of results) {
        const metadata = res.metadata;
        if (metadata && typeof metadata === 'object') {
          const resDocId = metadata['documentId'];
          if (typeof resDocId === 'string' && !seenDocumentIds.has(resDocId)) {
            allRelatedResults.push(res);
          }
        }
      }
    }

    if (allRelatedResults.length === 0) return [];

    // 3. Sort by score and take top unique documents
    const sorted = allRelatedResults.sort((a, b) => b.score - a.score);
    const uniqueDocs = new Map<string, string>();
    for (const item of sorted) {
      const metadata = item.metadata;
      if (metadata && typeof metadata === 'object') {
        const docId = metadata['documentId'];
        if (typeof docId === 'string' && !uniqueDocs.has(docId)) {
          uniqueDocs.set(docId, item.id);
        }
      }
      if (uniqueDocs.size >= 5) break;
    }

    // 4. Get full details for the representative chunks
    const targetChunkIds = Array.from(uniqueDocs.values());
    const chunkDetails =
      await this.queryRepository.findChunksByIds(targetChunkIds);

    return chunkDetails.map((d) => ({
      chunkId: d.chunkId,
      documentId: d.documentId,
      content: d.content,
      documentTitle: d.documentTitle,
      author: d.author ?? undefined,
      publishedAt: d.publishedAt?.toISOString() ?? undefined,
      sourceUrl: d.sourceUrl,
      score: 1.0,
      tags: d.tags,
      hasNote: d.hasNote,
    }));
  }
}
