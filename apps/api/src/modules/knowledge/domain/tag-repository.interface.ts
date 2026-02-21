import type { TagEntity } from './tag.entity.js';

export type TagRepository = {
  findOrCreate(name: string): Promise<TagEntity>;
  addTagToDocument(documentId: string, tagId: string): Promise<void>;
  removeTagFromDocument(documentId: string, tagName: string): Promise<void>;
  findByDocumentId(documentId: string): Promise<TagEntity[]>;
};
