import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRepository } from '../domain/collection-repository.interface.js';

@Injectable()
export class RemoveDocumentFromCollectionUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(collectionId: string, documentId: string): Promise<void> {
    const item =
      await this.collectionRepository.findItemByCollectionAndDocument(
        collectionId,
        documentId,
      );

    if (!item) {
      throw new NotFoundException(
        `Document ${documentId} is not in collection ${collectionId}`,
      );
    }

    await this.collectionRepository.removeItem(item.id);
  }
}
