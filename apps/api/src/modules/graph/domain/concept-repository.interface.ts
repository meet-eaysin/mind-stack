import type { RelationType } from "@repo/shared-types";

export interface ConceptEntity {
  id: string;
  label: string;
}

export interface ConceptRelationEntity {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationType: RelationType;
}

export interface ConceptRepository {
  findOrCreate(label: string): Promise<ConceptEntity>;
  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType
  ): Promise<ConceptRelationEntity>;
  findAll(): Promise<ConceptEntity[]>;
  findAllRelations(): Promise<ConceptRelationEntity[]>;
  findNeighborhood(
    conceptId: string,
    depth: number
  ): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }>;
  countChunksForConcept(conceptId: string): Promise<number>;
}
