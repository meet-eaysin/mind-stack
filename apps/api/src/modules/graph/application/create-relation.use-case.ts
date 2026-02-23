import { BadRequestException } from '@nestjs/common';
import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import { RELATION_TYPE, type RelationType } from '@repo/shared-types';

export class CreateRelationUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(input: {
    fromId: string;
    toId: string;
    type: RelationType;
  }): Promise<void> {
    if (input.fromId === input.toId) {
      throw new BadRequestException('Cannot create self relation');
    }

    const hierarchyRelationTypes: RelationType[] = [
      RELATION_TYPE.IS_PART_OF,
      RELATION_TYPE.IS_PREREQUISITE_OF,
    ];

    if (hierarchyRelationTypes.includes(input.type)) {
      const hasCycle = await this.conceptRepository.detectCycle(
        input.fromId,
        input.toId,
        10,
      );

      if (hasCycle) {
        throw new BadRequestException(
          'Relation would create a hierarchy cycle',
        );
      }
    }

    await this.conceptRepository.createRelation(
      input.fromId,
      input.toId,
      input.type,
    );
  }
}
