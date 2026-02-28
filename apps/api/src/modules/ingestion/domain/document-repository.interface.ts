import type { DocumentEntity } from '@/modules/ingestion/domain/document.entity';
import type { IngestionStatus, LearningStatus } from '@repo/shared-types';

export type DocumentRepository = {
  save(document: DocumentEntity): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  findAll(): Promise<DocumentEntity[]>;
  findBySourceUrl(url: string, userId: string): Promise<DocumentEntity | null>;
  updateStatus(id: string, status: IngestionStatus): Promise<void>;
  updateProcessingError(id: string, errorMessage: string | null): Promise<void>;
  updateImportance(id: string, score: number): Promise<void>;
  getImportance(id: string): Promise<number | null>;
  delete(id: string): Promise<void>;
  addStatusHistory(
    documentId: string,
    status: IngestionStatus,
    learningStatus: LearningStatus,
  ): Promise<void>;
};
