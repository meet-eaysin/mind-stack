import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { RelationType } from '@repo/shared-types';

export class CreateRelationUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(input: {
    fromId: string;
    toId: string;
    type: string;
  }): Promise<void> {
    await this.conceptRepository.createRelation(
      input.fromId,
      input.toId,
      input.type as RelationType,
    );
  }
}
