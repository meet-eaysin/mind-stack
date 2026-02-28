import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { DocumentEntity } from '@/modules/ingestion/domain/document.entity';
import type { ChunkRepository } from '@/modules/knowledge/domain/chunk-repository.interface';

export type ListDocumentsResultItem = DocumentEntity & {
  chunkCount: number;
};

export class ListDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async execute(input: {
    page: number;
    pageSize: number;
  }): Promise<{ documents: ListDocumentsResultItem[]; total: number }> {
    const { page, pageSize } = input;

    const allDocs = await this.findAllDocuments();
    const total = allDocs.length;
    const start = (page - 1) * pageSize;
    const paginated = allDocs.slice(start, start + pageSize);

    const documents: ListDocumentsResultItem[] = [];
    for (const doc of paginated) {
      const chunks = await this.chunkRepository.findByDocumentId(doc.id);
      documents.push({
        ...doc,
        chunkCount: chunks.length,
      });
    }

    return { documents, total };
  }

  private async findAllDocuments(): Promise<DocumentEntity[]> {
    return this.documentRepository.findAll();
  }
}
