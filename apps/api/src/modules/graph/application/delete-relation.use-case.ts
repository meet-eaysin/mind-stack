import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import { HIERARCHY_RELATION_TYPES } from '../domain/document-graph.js';

export class DeleteRelationUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(relationId: string): Promise<void> {
    const relation = await this.conceptRepository.findRelationById(relationId);
    if (!relation) {
      return;
    }

    const root = await this.conceptRepository.getRootConcept();
    await this.conceptRepository.deleteRelation(relationId);

    const isHierarchyRelation = HIERARCHY_RELATION_TYPES.includes(
      relation.relationType,
    );
    if (!isHierarchyRelation) {
      return;
    }

    const remaining = await this.conceptRepository.findRelationsForConcept(
      relation.fromConceptId,
    );
    const hasHierarchyParent = remaining.some(
      (rel) =>
        rel.fromConceptId === relation.fromConceptId &&
        HIERARCHY_RELATION_TYPES.includes(rel.relationType),
    );

    if (!hasHierarchyParent) {
      await this.conceptRepository.createRelation(
        relation.fromConceptId,
        root.id,
        'IS_PART_OF',
      );
    }
  }
}
