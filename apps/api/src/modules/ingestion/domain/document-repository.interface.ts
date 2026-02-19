import type { DocumentEntity } from './document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

export interface DocumentRepository {
  save(document: DocumentEntity): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findAll(): Promise<DocumentEntity[]>;
  updateStatus(id: string, status: IngestionStatus): Promise<void>;
}
