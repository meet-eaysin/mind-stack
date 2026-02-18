export interface ChunkEntity {
  id: string;
  documentId: string;
  content: string;
  startOffset: number;
  endOffset: number;
  createdAt: Date;
}
