import type { ChunkEntity } from "./chunk.entity.js";

export interface ChunkWithMeta {
  chunk: ChunkEntity;
  tags: string[];
  note: string | null;
  importanceScore: number | null;
}

export interface ChunkRepository {
  findByDocumentId(documentId: string): Promise<ChunkWithMeta[]>;
  findById(chunkId: string): Promise<ChunkWithMeta | null>;
  createMany(
    documentId: string,
    chunks: Array<{ content: string; startOffset: number; endOffset: number }>
  ): Promise<ChunkEntity[]>;
  updateImportance(chunkId: string, score: number): Promise<void>;
}
