import { DeleteRelationUseCase } from '@/modules/graph/application/delete-relation.use-case';
import type {
  ConceptEntity,
  ConceptRelationEntity,
  ConceptRepository,
} from '@/modules/graph/domain/concept-repository.interface';
import type { RelationType } from '@repo/shared-types';
import { ROOT_LABEL } from '@/modules/graph/domain/document-graph';

class FakeConceptRepository implements ConceptRepository {
  private concepts: ConceptEntity[] = [];
  private relations: ConceptRelationEntity[] = [];
  private idCounter = 0;

  findById(id: string): Promise<ConceptEntity | null> {
    return Promise.resolve(
      this.concepts.find((concept) => concept.id === id) ?? null,
    );
  }

  findByLabel(label: string): Promise<ConceptEntity | null> {
    return Promise.resolve(
      this.concepts.find((concept) => concept.label === label) ?? null,
    );
  }

  findOrCreate(label: string): Promise<ConceptEntity> {
    const existing = this.concepts.find((concept) => concept.label === label);
    if (existing) {
      return Promise.resolve(existing);
    }
    const concept = { id: `concept-${++this.idCounter}`, label };
    this.concepts.push(concept);
    return Promise.resolve(concept);
  }

  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    const existing = this.relations.find(
      (relation) =>
        relation.fromConceptId === fromId &&
        relation.toConceptId === toId &&
        relation.relationType === relationType,
    );
    if (existing) {
      return Promise.resolve(existing);
    }
    const relation = {
      id: `rel-${this.relations.length + 1}`,
      fromConceptId: fromId,
      toConceptId: toId,
      relationType,
    };
    this.relations.push(relation);
    return Promise.resolve(relation);
  }

  findRelationsForConcept(conceptId: string): Promise<ConceptRelationEntity[]> {
    return Promise.resolve(
      this.relations.filter(
        (relation) =>
          relation.fromConceptId === conceptId ||
          relation.toConceptId === conceptId,
      ),
    );
  }

  findAll(): Promise<ConceptEntity[]> {
    return Promise.resolve(this.concepts);
  }

  findAllRelations(): Promise<ConceptRelationEntity[]> {
    return Promise.resolve(this.relations);
  }

  findNeighborhood(): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }> {
    return Promise.resolve({ concepts: [], relations: [] });
  }

  countChunksForConcept(): Promise<number> {
    return Promise.resolve(0);
  }

  linkConceptToChunk(): Promise<void> {
    return Promise.resolve();
  }

  findAssociatedChunks(): Promise<
    Array<{
      id: string;
      content: string;
      documentId: string;
      documentTitle: string;
    }>
  > {
    return Promise.resolve([]);
  }

  async getRootConcept(): Promise<ConceptEntity> {
    const existing = await this.findByLabel(ROOT_LABEL);
    if (existing) {
      return existing;
    }
    const root = { id: `concept-${++this.idCounter}`, label: ROOT_LABEL };
    this.concepts.push(root);
    return root;
  }

  findRelationById(relationId: string): Promise<ConceptRelationEntity | null> {
    return Promise.resolve(
      this.relations.find((relation) => relation.id === relationId) ?? null,
    );
  }

  detectCycle(): Promise<boolean> {
    return Promise.resolve(false);
  }

  deleteRelation(relationId: string): Promise<void> {
    this.relations = this.relations.filter(
      (relation) => relation.id !== relationId,
    );
    return Promise.resolve();
  }

  deleteConcept(conceptId: string): Promise<void> {
    this.concepts = this.concepts.filter((concept) => concept.id !== conceptId);
    this.relations = this.relations.filter(
      (relation) =>
        relation.fromConceptId !== conceptId &&
        relation.toConceptId !== conceptId,
    );
    return Promise.resolve();
  }

  getRelations(): ConceptRelationEntity[] {
    return this.relations;
  }
}

describe('DeleteRelationUseCase', () => {
  it('reattaches child to root when deleting last hierarchy parent', async () => {
    const repository = new FakeConceptRepository();
    const useCase = new DeleteRelationUseCase(repository);

    const root = await repository.getRootConcept();
    const child = await repository.findOrCreate('doc:doc-1');
    const parent = await repository.findOrCreate('doc:doc-2');
    const relation = await repository.createRelation(
      child.id,
      parent.id,
      'IS_PART_OF',
    );

    await useCase.execute(relation.id);

    expect(
      repository
        .getRelations()
        .some(
          (item) =>
            item.fromConceptId === child.id &&
            item.toConceptId === root.id &&
            item.relationType === 'IS_PART_OF',
        ),
    ).toBe(true);
  });

  it('does not attach root for non-hierarchy relation deletion', async () => {
    const repository = new FakeConceptRepository();
    const useCase = new DeleteRelationUseCase(repository);

    const child = await repository.findOrCreate('doc:doc-1');
    const peer = await repository.findOrCreate('doc:doc-2');
    const relation = await repository.createRelation(
      child.id,
      peer.id,
      'SIMILAR_TO',
    );

    await useCase.execute(relation.id);

    expect(
      repository
        .getRelations()
        .some(
          (item) =>
            item.fromConceptId === child.id &&
            item.relationType === 'IS_PART_OF',
        ),
    ).toBe(false);
  });
});
