import type { ConceptRepository } from '../domain/concept-repository.interface.js';

export class DeleteRelationUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(relationId: string): Promise<void> {
    await this.conceptRepository.deleteRelation(relationId);
  }
}
