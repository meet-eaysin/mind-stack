import { NotFoundException } from '@nestjs/common';
import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { ChunkRepository } from '@/modules/knowledge/domain/chunk-repository.interface';
import type { TagRepository } from '@/modules/knowledge/domain/tag-repository.interface';
import type { NoteRepository } from '@/modules/knowledge/domain/note-repository.interface';
import type { DocumentEntity } from '@/modules/ingestion/domain/document.entity';
import type { ChunkEntity } from '@/modules/knowledge/domain/chunk.entity';
import type { TagEntity } from '@/modules/knowledge/domain/tag.entity';
import type { NoteEntity } from '@/modules/knowledge/domain/note.entity';

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
      throw new NotFoundException(`Document not found: ${documentId}`);
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
