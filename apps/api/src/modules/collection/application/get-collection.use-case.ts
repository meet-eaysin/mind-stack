import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRepository } from '../domain/collection-repository.interface.js';
import type { CollectionDetailResponse } from '@repo/shared-types';

@Injectable()
export class GetCollectionUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(id: string): Promise<CollectionDetailResponse> {
    const collection = await this.collectionRepository.findWithItems(id);

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      goal: collection.goal,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
      items: collection.items.map((item) => ({
        id: item.id,
        documentId: item.documentId,
        documentTitle: item.documentTitle,
        learningStatus: item.learningStatus,
        order: item.order,
        prerequisiteId: item.prerequisiteId,
      })),
    };
  }
}
