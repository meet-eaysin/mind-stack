import { type SourceType } from '@repo/shared-types';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../ingestion/domain/document.entity.js';
import type { ChunkRepository } from '../domain/chunk-repository.interface.js';

type DocumentListItem = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  chunkCount: number;
  createdAt: Date;
};

export class ListDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async execute(input: {
    page: number;
    pageSize: number;
  }): Promise<{ documents: DocumentListItem[]; total: number }> {
    const { page, pageSize } = input;

    const allDocs = await this.findAllDocuments();
    const total = allDocs.length;
    const start = (page - 1) * pageSize;
    const paginated = allDocs.slice(start, start + pageSize);

    const documents: DocumentListItem[] = [];
    for (const doc of paginated) {
      const chunks = await this.chunkRepository.findByDocumentId(doc.id);
      documents.push({
        id: doc.id,
        title: doc.title,
        sourceType: doc.sourceType,
        sourceUrl: doc.sourceUrl,
        chunkCount: chunks.length,
        createdAt: doc.createdAt,
      });
    }

    return { documents, total };
  }

  private async findAllDocuments(): Promise<DocumentEntity[]> {
    return this.documentRepository.findAll();
  }
}
