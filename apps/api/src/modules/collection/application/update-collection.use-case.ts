import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRepository } from '@/modules/collection/domain/collection-repository.interface';
import { CollectionEntity } from '@/modules/collection/domain/collection.entity';

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
