import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRepository } from '@/modules/collection/domain/collection-repository.interface';

@Injectable()
export class DeleteCollectionUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.collectionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    await this.collectionRepository.delete(id);
  }
}
