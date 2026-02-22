import type { AnnotationType } from '@repo/shared-types';

export type NoteEntity = {
  id: string;
  documentId: string;
  chunkId?: string | null;
  selectedText?: string | null;
  content: string;
  type: AnnotationType;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};
