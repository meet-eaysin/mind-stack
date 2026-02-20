import type { RelationType } from '@repo/shared-types';

export type ConceptEntity = {
  id: string;
  label: string;
};

export type ConceptRelationEntity = {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationType: RelationType;
};

export type ConceptRepository = {
  findOrCreate(label: string): Promise<ConceptEntity>;
  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity>;
  findAll(): Promise<ConceptEntity[]>;
  findAllRelations(): Promise<ConceptRelationEntity[]>;
  findNeighborhood(
    conceptId: string,
    depth: number,
  ): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }>;
  countChunksForConcept(conceptId: string): Promise<number>;
  linkConceptToChunk(conceptId: string, chunkId: string): Promise<void>;
};
