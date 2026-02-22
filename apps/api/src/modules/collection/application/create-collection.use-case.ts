import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CollectionRepository } from '../domain/collection-repository.interface.js';
import { CollectionEntity } from '../domain/collection.entity.js';

@Injectable()
export class CreateCollectionUseCase {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async execute(input: {
    name: string;
    description?: string;
    goal?: string;
  }): Promise<CollectionEntity> {
    const collection: CollectionEntity = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      goal: input.goal ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.collectionRepository.save(collection);
  }
}
