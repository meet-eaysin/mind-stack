import { Injectable } from '@nestjs/common';
import { CollectionRepository } from '../domain/collection-repository.interface.js';
import type { CollectionListItem } from '@repo/shared-types';

@Injectable()
export class ListCollectionsUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(): Promise<CollectionListItem[]> {
    const collections = await this.collectionRepository.findAll();

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      itemCount: c.itemCount,
      progress: c.progress,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }
}
