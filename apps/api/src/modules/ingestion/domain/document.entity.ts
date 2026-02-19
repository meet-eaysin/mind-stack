import type { SourceType, IngestionStatus } from '@repo/shared-types';

export interface DocumentEntity {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  rawContent: string;
  status: IngestionStatus;
  createdAt: Date;
}

export function createDocument(params: {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  rawContent: string;
}): DocumentEntity {
  return {
    id: params.id,
    title: params.title,
    sourceType: params.sourceType,
    sourceUrl: params.sourceUrl,
    rawContent: params.rawContent,
    status: 'PENDING',
    createdAt: new Date(),
  };
}
