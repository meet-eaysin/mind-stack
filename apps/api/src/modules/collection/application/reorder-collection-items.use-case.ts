import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRepository } from '@/modules/collection/domain/collection-repository.interface';

@Injectable()
export class ReorderCollectionItemsUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(collectionId: string, itemIds: string[]): Promise<void> {
    const collection =
      await this.collectionRepository.findWithItems(collectionId);
    if (!collection) {
      throw new NotFoundException(
        `Collection with ID ${collectionId} not found`,
      );
    }

    // itemIds are documentIds in this context or specific CollectionItem IDs?
    // The DTO says itemIds: string[]. Let's assume they are CollectionItem IDs for precision.

    const updates = itemIds.map((id, index) =>
      this.collectionRepository.updateItemOrder(id, index),
    );

    await Promise.all(updates);
  }
}
