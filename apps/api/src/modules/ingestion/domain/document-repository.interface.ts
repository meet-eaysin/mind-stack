import type { DocumentEntity } from './document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

export type DocumentRepository = {
  save(document: DocumentEntity): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findAll(): Promise<DocumentEntity[]>;
  findBySourceUrl(url: string): Promise<DocumentEntity | null>;
  updateStatus(id: string, status: IngestionStatus): Promise<void>;
  updateImportance(id: string, score: number): Promise<void>;
  getImportance(id: string): Promise<number | null>;
};
