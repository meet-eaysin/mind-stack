import type { ChunkEntity } from './chunk.entity.js';

export type ChunkRepository = {
  findByDocumentId(documentId: string): Promise<ChunkEntity[]>;
  findById(chunkId: string): Promise<ChunkEntity | null>;
  countByDocumentId(documentId: string): Promise<number>;
  createMany(
    documentId: string,
    chunks: Array<{ content: string; startOffset: number; endOffset: number }>,
  ): Promise<ChunkEntity[]>;
  deleteByDocumentId(documentId: string): Promise<void>;
};
