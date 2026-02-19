import { GetNeighborhoodUseCase } from '../get-neighborhood.use-case.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../../domain/concept-repository.interface.js';
import type { RelationType } from '@repo/shared-types';

// ── Fakes ──

class FakeConceptRepository implements ConceptRepository {
  private concepts: ConceptEntity[] = [];
  private relations: ConceptRelationEntity[] = [];
  private chunkCounts: Map<string, number> = new Map();

  seedConcepts(concepts: ConceptEntity[]): void {
    this.concepts = concepts;
  }

  seedRelations(relations: ConceptRelationEntity[]): void {
    this.relations = relations;
  }

  seedChunkCount(conceptId: string, count: number): void {
    this.chunkCounts.set(conceptId, count);
  }

  findOrCreate(label: string): Promise<ConceptEntity> {
    const existing = this.concepts.find((c) => c.label === label);
    if (existing) return Promise.resolve(existing);
    const concept: ConceptEntity = {
      id: `concept-${String(this.concepts.length + 1)}`,
      label,
    };
    this.concepts.push(concept);
    return Promise.resolve(concept);
  }

  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    const relation: ConceptRelationEntity = {
      id: `rel-${String(this.relations.length + 1)}`,
      fromConceptId: fromId,
      toConceptId: toId,
      relationType,
    };
    this.relations.push(relation);
    return Promise.resolve(relation);
  }

  findAll(): Promise<ConceptEntity[]> {
    return Promise.resolve(this.concepts);
  }

  findAllRelations(): Promise<ConceptRelationEntity[]> {
    return Promise.resolve(this.relations);
  }

  findNeighborhood(
    conceptId: string,
    _depth: number,
  ): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }> {
    const neighborConcepts = this.concepts.filter((c) => c.id === conceptId);
    const neighborRelations = this.relations.filter(
      (r) => r.fromConceptId === conceptId || r.toConceptId === conceptId,
    );
    return Promise.resolve({
      concepts: neighborConcepts,
      relations: neighborRelations,
    });
  }

  countChunksForConcept(conceptId: string): Promise<number> {
    return Promise.resolve(this.chunkCounts.get(conceptId) ?? 0);
  }
}

// ── Tests ──

describe('GetNeighborhoodUseCase', () => {
  let useCase: GetNeighborhoodUseCase;
  let conceptRepository: FakeConceptRepository;

  beforeEach(() => {
    conceptRepository = new FakeConceptRepository();
    useCase = new GetNeighborhoodUseCase(conceptRepository);
  });

  it('should return neighborhood nodes and edges for a concept', async () => {
    conceptRepository.seedConcepts([
      { id: 'c1', label: 'TypeScript' },
      { id: 'c2', label: 'NestJS' },
    ]);
    conceptRepository.seedRelations([
      {
        id: 'r1',
        fromConceptId: 'c1',
        toConceptId: 'c2',
        relationType: 'DEPENDS_ON',
      },
    ]);
    conceptRepository.seedChunkCount('c1', 4);

    const result = await useCase.execute({ conceptId: 'c1' });

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.label).toBe('TypeScript');
    expect(result.nodes[0]?.chunkCount).toBe(4);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.relationType).toBe('DEPENDS_ON');
  });

  it('should default depth to 2 when not specified', async () => {
    const findNeighborhoodSpy = jest.spyOn(
      conceptRepository,
      'findNeighborhood',
    );
    conceptRepository.seedConcepts([{ id: 'c1', label: 'Test' }]);

    await useCase.execute({ conceptId: 'c1' });

    expect(findNeighborhoodSpy).toHaveBeenCalledWith('c1', 2);
  });

  it('should use the provided depth', async () => {
    const findNeighborhoodSpy = jest.spyOn(
      conceptRepository,
      'findNeighborhood',
    );
    conceptRepository.seedConcepts([{ id: 'c1', label: 'Test' }]);

    await useCase.execute({ conceptId: 'c1', depth: 3 });

    expect(findNeighborhoodSpy).toHaveBeenCalledWith('c1', 3);
  });
});
