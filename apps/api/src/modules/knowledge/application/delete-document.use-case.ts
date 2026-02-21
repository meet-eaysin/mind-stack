import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { ChunkRepository } from '../domain/chunk-repository.interface.js';
import type { VectorStore } from '@repo/vector-store';

export class DeleteDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly vectorStore: VectorStore,
  ) {}

  async execute(documentId: string): Promise<void> {
    // 1. Fetch chunks to delete them from vector store
    const chunks = await this.chunkRepository.findByDocumentId(documentId);

    // 2. Delete embeddings from ChromaDB
    const chunkIds = chunks.map((c) => c.id);
    if (chunkIds.length > 0) {
      await this.vectorStore.delete(chunkIds);
    }

    // 3. Delete document from database (cascades down to chunks, notes, tags)
    await this.documentRepository.delete(documentId);
  }
}
