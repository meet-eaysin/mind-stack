import type { SourceType, IngestionStatus } from '@repo/shared-types';

export type DocumentEntity = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  rawContent: string;
  status: IngestionStatus;
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
}): DocumentEntity {
  return {
    id: params.id,
    title: params.title,
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
    rawContent: params.rawContent,
    status: params.status ?? 'INGESTED',
    createdAt: new Date(),
    deletedAt: null,
  };
}
