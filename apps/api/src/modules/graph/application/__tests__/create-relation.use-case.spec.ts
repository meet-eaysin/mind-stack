import { BadRequestException } from '@nestjs/common';
import { CreateRelationUseCase } from '../create-relation.use-case.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../../domain/concept-repository.interface.js';
import { RELATION_TYPE, type RelationType } from '@repo/shared-types';

class FakeConceptRepository implements ConceptRepository {
  private readonly relationCalls: Array<{
    fromId: string;
    toId: string;
    relationType: RelationType;
  }> = [];
  private cycleResult = false;

  setCycleResult(value: boolean): void {
    this.cycleResult = value;
  }

  getRelationCalls(): Array<{
    fromId: string;
    toId: string;
    relationType: RelationType;
  }> {
    return this.relationCalls;
  }

  findOrCreate(_label: string): Promise<ConceptEntity> {
    throw new Error('Not implemented');
  }
  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    this.relationCalls.push({ fromId, toId, relationType });
    return Promise.resolve({
      id: 'rel-1',
      fromConceptId: fromId,
      toConceptId: toId,
      relationType,
    });
  }
  findAll(): Promise<ConceptEntity[]> {
    throw new Error('Not implemented');
  }
  findAllRelations(): Promise<ConceptRelationEntity[]> {
    throw new Error('Not implemented');
  }
  findNeighborhood(_conceptId: string, _depth: number): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }> {
    throw new Error('Not implemented');
  }
  countChunksForConcept(_conceptId: string): Promise<number> {
    throw new Error('Not implemented');
  }
  linkConceptToChunk(_conceptId: string, _chunkId: string): Promise<void> {
    throw new Error('Not implemented');
  }
  findAssociatedChunks(_conceptId: string): Promise<
    Array<{
      id: string;
      content: string;
      documentId: string;
      documentTitle: string;
    }>
  > {
    throw new Error('Not implemented');
  }
  getRootConcept(): Promise<ConceptEntity> {
    throw new Error('Not implemented');
  }
  detectCycle(
    _fromId: string,
    _toId: string,
    _maxDepth?: number,
  ): Promise<boolean> {
    return Promise.resolve(this.cycleResult);
  }
  deleteRelation(_relationId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

describe('CreateRelationUseCase', () => {
  it('rejects self relation', async () => {
    const repo = new FakeConceptRepository();
    const useCase = new CreateRelationUseCase(repo);

    await expect(
      useCase.execute({
        fromId: 'a',
        toId: 'a',
        type: RELATION_TYPE.RELATES_TO,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects hierarchy cycles', async () => {
    const repo = new FakeConceptRepository();
    repo.setCycleResult(true);
    const useCase = new CreateRelationUseCase(repo);

    await expect(
      useCase.execute({
        fromId: 'a',
        toId: 'b',
        type: RELATION_TYPE.IS_PART_OF,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.getRelationCalls()).toHaveLength(0);
  });

  it('allows semantic relations without cycle checks', async () => {
    const repo = new FakeConceptRepository();
    repo.setCycleResult(true);
    const useCase = new CreateRelationUseCase(repo);

    await expect(
      useCase.execute({
        fromId: 'a',
        toId: 'b',
        type: RELATION_TYPE.RELATES_TO,
      }),
    ).resolves.toBeUndefined();
    expect(repo.getRelationCalls()).toEqual([
      {
        fromId: 'a',
        toId: 'b',
        relationType: RELATION_TYPE.RELATES_TO,
      },
    ]);
  });
});
