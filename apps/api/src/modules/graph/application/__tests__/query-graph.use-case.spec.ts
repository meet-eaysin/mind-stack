import { QueryGraphUseCase } from '../query-graph.use-case.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../../domain/concept-repository.interface.js';
import type { RelationType } from '@repo/shared-types';

// ── Fixtures ──

function createConceptFixture(
  overrides: Partial<ConceptEntity> = {},
): ConceptEntity {
  return {
    id: 'concept-1',
    label: 'TypeScript',
    ...overrides,
  };
}

function createRelationFixture(
  overrides: Partial<ConceptRelationEntity> = {},
): ConceptRelationEntity {
  return {
    id: 'rel-1',
    fromConceptId: 'concept-1',
    toConceptId: 'concept-2',
    relationType: 'RELATES_TO',
    ...overrides,
  };
}

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

describe('QueryGraphUseCase', () => {
  let useCase: QueryGraphUseCase;
  let conceptRepository: FakeConceptRepository;

  beforeEach(() => {
    conceptRepository = new FakeConceptRepository();
    useCase = new QueryGraphUseCase(conceptRepository);
  });

  it('should return all nodes with chunk counts and all edges', async () => {
    conceptRepository.seedConcepts([
      createConceptFixture({ id: 'c1', label: 'TypeScript' }),
      createConceptFixture({ id: 'c2', label: 'NestJS' }),
    ]);
    conceptRepository.seedRelations([
      createRelationFixture({
        id: 'r1',
        fromConceptId: 'c1',
        toConceptId: 'c2',
        relationType: 'RELATES_TO',
      }),
    ]);
    conceptRepository.seedChunkCount('c1', 5);
    conceptRepository.seedChunkCount('c2', 3);

    const result = await useCase.execute();

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]?.label).toBe('TypeScript');
    expect(result.nodes[0]?.chunkCount).toBe(5);
    expect(result.nodes[1]?.label).toBe('NestJS');
    expect(result.nodes[1]?.chunkCount).toBe(3);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.fromId).toBe('c1');
    expect(result.edges[0]?.toId).toBe('c2');
    expect(result.edges[0]?.relationType).toBe('RELATES_TO');
  });

  it('should return empty nodes and edges when no concepts exist', async () => {
    const result = await useCase.execute();

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });
});
