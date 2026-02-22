import { Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { LearningStatus, DocumentType } from '@repo/shared-types';

@Injectable()
export class UpdateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(
    id: string,
    params: {
      title?: string;
      sourceUrl?: string;
      learningStatus?: LearningStatus;
      type?: DocumentType;
      author?: string;
      publisher?: string;
      publishedAt?: string;
      language?: string;
    },
  ): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const oldLearningStatus = document.learningStatus;
    const oldStatus = document.status;

    if (params.title !== undefined) {
      document.title = params.title;
    }
    if (params.sourceUrl !== undefined) {
      document.sourceUrl = params.sourceUrl;
    }
    if (params.learningStatus !== undefined) {
      document.learningStatus = params.learningStatus;
    }
    if (params.type !== undefined) {
      document.type = params.type;
    }
    if (params.author !== undefined) {
      document.author = params.author;
    }
    if (params.publisher !== undefined) {
      document.publisher = params.publisher;
    }
    if (params.publishedAt !== undefined) {
      document.publishedAt = params.publishedAt
        ? new Date(params.publishedAt)
        : null;
    }
    if (params.language !== undefined) {
      document.language = params.language;
    }

    await this.documentRepository.save(document);

    if (
      document.learningStatus !== oldLearningStatus ||
      document.status !== oldStatus
    ) {
      await this.documentRepository.addStatusHistory(
        document.id,
        document.status,
        document.learningStatus,
      );
    }
  }
}
