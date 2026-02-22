import type { ChunkReference, DocumentSearchResult } from '@repo/shared-types';

export function groupChunksToDocuments(
  chunks: ChunkReference[],
): DocumentSearchResult[] {
  const docMap = new Map<string, DocumentSearchResult>();

  for (const chunk of chunks) {
    const docId = String(chunk.documentId);

    if (!docMap.has(docId)) {
      docMap.set(docId, {
        documentId: docId,
        title: chunk.documentTitle,
        author: chunk.author ?? undefined,
        publishedAt: chunk.publishedAt ?? undefined,
        sourceUrl: chunk.sourceUrl ?? null,
        score: chunk.score,
        tags: chunk.tags,
        hasNote: chunk.hasNote,
        matchingChunks: [],
      });
    }

    const doc = docMap.get(docId)!;
    doc.matchingChunks.push({
      chunkId: chunk.chunkId,
      content: chunk.content,
      score: chunk.score,
    });

    if (chunk.score > doc.score) {
      doc.score = chunk.score;
    }
  }

  return Array.from(docMap.values()).sort((a, b) => b.score - a.score);
}
