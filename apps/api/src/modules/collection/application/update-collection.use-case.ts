import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRepository } from '../domain/collection-repository.interface.js';
import { CollectionEntity } from '../domain/collection.entity.js';

@Injectable()
export class UpdateCollectionUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(
    id: string,
    input: {
      name?: string;
      description?: string;
      goal?: string;
    },
  ): Promise<CollectionEntity> {
    const existing = await this.collectionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return this.collectionRepository.update(id, input);
  }
}
