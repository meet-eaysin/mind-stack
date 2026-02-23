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
  findById(id: string): Promise<ConceptEntity | null>;
  findByLabel(label: string): Promise<ConceptEntity | null>;
  findOrCreate(label: string): Promise<ConceptEntity>;
  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity>;
  findRelationsForConcept(conceptId: string): Promise<ConceptRelationEntity[]>;
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
  findAssociatedChunks(conceptId: string): Promise<
    Array<{
      id: string;
      content: string;
      documentId: string;
      documentTitle: string;
    }>
  >;
  getRootConcept(): Promise<ConceptEntity>;
  findRelationById(relationId: string): Promise<ConceptRelationEntity | null>;
  detectCycle(
    fromId: string,
    toId: string,
    relationTypes?: RelationType[],
    maxDepth?: number,
  ): Promise<boolean>;
  deleteRelation(relationId: string): Promise<void>;
  deleteConcept(conceptId: string): Promise<void>;
};
