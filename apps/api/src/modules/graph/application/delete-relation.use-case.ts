import type { ConceptRepository } from '@/modules/graph/domain/concept-repository.interface';
import { RELATION_TYPE } from '@repo/shared-types';

const isHierarchyRelationType = (value: string): boolean =>
  value === RELATION_TYPE.IS_PART_OF ||
  value === RELATION_TYPE.IS_PREREQUISITE_OF;

export class DeleteRelationUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(relationId: string): Promise<void> {
    const relation = await this.conceptRepository.findRelationById(relationId);
    if (!relation) {
      return;
    }

    const root = await this.conceptRepository.getRootConcept();
    await this.conceptRepository.deleteRelation(relationId);

    const fromConceptId = String(relation.fromConceptId);
    const relationType = String(relation.relationType);
    const isHierarchyRelation = isHierarchyRelationType(relationType);
    if (!isHierarchyRelation) {
      return;
    }

    const remaining =
      await this.conceptRepository.findRelationsForConcept(fromConceptId);
    const hasHierarchyParent = remaining.some(
      (rel) =>
        String(rel.fromConceptId) === fromConceptId &&
        isHierarchyRelationType(String(rel.relationType)),
    );

    if (!hasHierarchyParent) {
      await this.conceptRepository.createRelation(
        fromConceptId,
        String(root.id),
        RELATION_TYPE.IS_PART_OF,
      );
    }
  }
}
