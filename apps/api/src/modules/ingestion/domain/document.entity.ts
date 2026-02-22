import type {
  SourceType,
  IngestionStatus,
  LearningStatus,
  DocumentType,
} from '@repo/shared-types';

export type DocumentEntity = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  rawContent: string;
  status: IngestionStatus;
  learningStatus: LearningStatus;
  type: DocumentType;
  author: string | null;
  publisher: string | null;
  publishedAt: Date | null;
  language: string;
  addedByUserAt: Date;
  createdAt: Date;
  deletedAt?: Date | null;
};

export function createDocument(params: {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  rawContent: string;
  status?: IngestionStatus;
  learningStatus?: LearningStatus;
  type?: DocumentType;
  author?: string | null;
  publisher?: string | null;
  publishedAt?: Date | null;
  language?: string;
  addedByUserAt?: Date;
}): DocumentEntity {
  return {
    id: params.id,
    title: params.title,
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
    rawContent: params.rawContent,
    status: params.status ?? 'INGESTED',
    learningStatus: params.learningStatus ?? 'UPCOMING',
    type: params.type ?? 'OTHER',
    author: params.author ?? null,
    publisher: params.publisher ?? null,
    publishedAt: params.publishedAt ?? null,
    language: params.language ?? 'en',
    addedByUserAt: params.addedByUserAt ?? new Date(),
    createdAt: new Date(),
    deletedAt: null,
  };
}
