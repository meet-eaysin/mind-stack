import { Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';

@Injectable()
export class UpdateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(
    id: string,
    params: { title?: string; sourceUrl?: string },
  ): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (params.title !== undefined) {
      document.title = params.title;
    }
    if (params.sourceUrl !== undefined) {
      document.sourceUrl = params.sourceUrl;
    }

    await this.documentRepository.save(document);
  }
}
