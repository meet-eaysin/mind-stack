import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CollectionRepository } from '../domain/collection-repository.interface.js';
import { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';

@Injectable()
export class AddDocumentToCollectionUseCase {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(input: {
    collectionId: string;
    documentId: string;
    order?: number;
    prerequisiteId?: string;
  }): Promise<void> {
    const collection = await this.collectionRepository.findById(
      input.collectionId,
    );
    if (!collection) {
      throw new NotFoundException(
        `Collection with ID ${input.collectionId} not found`,
      );
    }

    const document = await this.documentRepository.findById(input.documentId);
    if (!document) {
      throw new NotFoundException(
        `Document with ID ${input.documentId} not found`,
      );
    }

    const existing =
      await this.collectionRepository.findItemByCollectionAndDocument(
        input.collectionId,
        input.documentId,
      );

    if (existing) {
      throw new BadRequestException('Document is already in this collection');
    }

    let order = input.order;
    if (order === undefined) {
      const allWithItems = await this.collectionRepository.findWithItems(
        input.collectionId,
      );
      order = allWithItems?.items.length ?? 0;
    }

    await this.collectionRepository.addItem({
      collectionId: input.collectionId,
      documentId: input.documentId,
      order,
      prerequisiteId: input.prerequisiteId ?? null,
    });
  }
}
