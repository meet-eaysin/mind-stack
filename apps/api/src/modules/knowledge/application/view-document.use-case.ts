import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type {
  ChunkRepository,
  ChunkWithMeta,
} from '../domain/chunk-repository.interface.js';
import type { DocumentDetailResponse, ChunkResponse } from '@repo/shared-types';
import type { SourceType } from '@repo/shared-types';

export class ViewDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async execute(documentId: string): Promise<DocumentDetailResponse> {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const chunksWithMeta =
      await this.chunkRepository.findByDocumentId(documentId);

    const chunks: ChunkResponse[] = chunksWithMeta.map(
      (cwm: ChunkWithMeta) => ({
        id: cwm.chunk.id,
        content: cwm.chunk.content,
        startOffset: cwm.chunk.startOffset,
        endOffset: cwm.chunk.endOffset,
        tags: cwm.tags,
        note: cwm.note,
        importanceScore: cwm.importanceScore,
        createdAt: cwm.chunk.createdAt.toISOString(),
      }),
    );

    return {
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType as SourceType,
      sourceUrl: doc.sourceUrl,
      rawContent: doc.rawContent,
      chunks,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
