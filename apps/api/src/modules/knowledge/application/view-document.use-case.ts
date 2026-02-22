import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { ChunkRepository } from '../domain/chunk-repository.interface.js';
import type { TagRepository } from '../domain/tag-repository.interface.js';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { DocumentEntity } from '../../ingestion/domain/document.entity.js';
import type { ChunkEntity } from '../domain/chunk.entity.js';
import type { TagEntity } from '../domain/tag.entity.js';
import type { NoteEntity } from '../domain/note.entity.js';

export type ViewDocumentResult = {
  document: DocumentEntity;
  chunks: ChunkEntity[];
  tags: TagEntity[];
  notes: NoteEntity[];
  importanceScore: number | null;
};

export class ViewDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly tagRepository: TagRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async execute(documentId: string): Promise<ViewDocumentResult> {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    const tags = await this.tagRepository.findByDocumentId(documentId);
    const notes = await this.noteRepository.findManyByDocumentId(documentId);
    const importanceScore =
      await this.documentRepository.getImportance(documentId);

    return {
      document: doc,
      chunks,
      tags,
      notes,
      importanceScore,
    };
  }
}
