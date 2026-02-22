import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { ChunkRepository } from '../domain/chunk-repository.interface.js';
import type { TagRepository } from '../domain/tag-repository.interface.js';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { DocumentDetailResponse, ChunkResponse } from '@repo/shared-types';

export class ViewDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly tagRepository: TagRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async execute(documentId: string): Promise<DocumentDetailResponse> {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const chunksEntity =
      await this.chunkRepository.findByDocumentId(documentId);
    const tags = await this.tagRepository.findByDocumentId(documentId);
    const notesEntities =
      await this.noteRepository.findManyByDocumentId(documentId);
    const importance = await this.documentRepository.getImportance(documentId);

    const chunks: ChunkResponse[] = chunksEntity.map((c) => ({
      id: c.id,
      content: c.content,
      startOffset: c.startOffset,
      endOffset: c.endOffset,
      createdAt: c.createdAt.toISOString(),
    }));

    return {
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      rawContent: doc.rawContent,
      chunks,
      tags: tags.map((t) => t.name),
      notes: notesEntities.map((n) => ({
        id: n.id,
        content: n.content,
        type: n.type,
        chunkId: n.chunkId ?? null,
        selectedText: n.selectedText ?? null,
        metadata: n.metadata ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      importanceScore: importance,
      status: doc.status,
      learningStatus: doc.learningStatus,
      type: doc.type,
      author: doc.author,
      publisher: doc.publisher,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
      language: doc.language,
      addedByUserAt: doc.addedByUserAt.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
