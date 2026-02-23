import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../domain/concept-repository.interface.js';
import type { RelationType } from '@repo/shared-types';
import { RELATION_TYPE } from '@repo/shared-types';

@Injectable()
export class PrismaConceptRepository implements ConceptRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRelation(r: {
    id: string;
    fromConceptId: string;
    toConceptId: string;
    relationType: string;
  }): ConceptRelationEntity | null {
    const relationType = this.toRelationType(r.relationType);
    if (!relationType) {
      return null;
    }
    return {
      id: r.id,
      fromConceptId: r.fromConceptId,
      toConceptId: r.toConceptId,
      relationType,
    };
  }

  private toRelationType(value: string): RelationType | null {
    const relationTypes = Object.values(RELATION_TYPE);
    const matched = relationTypes.find((type) => type === value);
    return matched ?? null;
  }

  async findById(id: string): Promise<ConceptEntity | null> {
    const concept = await this.prisma.concept.findUnique({
      where: { id },
    });
    if (!concept) return null;
    return { id: concept.id, label: concept.label };
  }

  async findByLabel(label: string): Promise<ConceptEntity | null> {
    const concept = await this.prisma.concept.findUnique({
      where: { label },
    });
    if (!concept) return null;
    return { id: concept.id, label: concept.label };
  }

  async findOrCreate(label: string): Promise<ConceptEntity> {
    const concept = await this.prisma.concept.upsert({
      where: { label },
      update: {},
      create: { id: randomUUID(), label },
    });

    return { id: concept.id, label: concept.label };
  }

  async createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    const existing = await this.prisma.conceptRelation.findUnique({
      where: {
        fromConceptId_toConceptId_relationType: {
          fromConceptId: fromId,
          toConceptId: toId,
          relationType,
        },
      },
    });

    if (existing) {
      const mapped = this.mapRelation(existing);
      if (!mapped) {
        throw new Error(`Invalid relation type: ${existing.relationType}`);
      }
      return mapped;
    }

    const created = await this.prisma.conceptRelation.create({
      data: {
        id: randomUUID(),
        fromConceptId: fromId,
        toConceptId: toId,
        relationType,
      },
    });

    const mapped = this.mapRelation(created);
    if (!mapped) {
      throw new Error(`Invalid relation type: ${created.relationType}`);
    }
    return mapped;
  }

  async findRelationsForConcept(
    conceptId: string,
  ): Promise<ConceptRelationEntity[]> {
    const rows = await this.prisma.conceptRelation.findMany({
      where: {
        OR: [{ fromConceptId: conceptId }, { toConceptId: conceptId }],
      },
    });
    return rows
      .map((r) => this.mapRelation(r))
      .filter(
        (relation): relation is ConceptRelationEntity => relation !== null,
      );
  }

  async findAll(): Promise<ConceptEntity[]> {
    const rows = await this.prisma.concept.findMany();
    return rows.map((r) => ({ id: r.id, label: r.label }));
  }

  async findAllRelations(): Promise<ConceptRelationEntity[]> {
    const rows = await this.prisma.conceptRelation.findMany();
    return rows
      .map((r) => this.mapRelation(r))
      .filter(
        (relation): relation is ConceptRelationEntity => relation !== null,
      );
  }

  async findRelationById(
    relationId: string,
  ): Promise<ConceptRelationEntity | null> {
    const relation = await this.prisma.conceptRelation.findUnique({
      where: { id: relationId },
    });
    if (!relation) {
      return null;
    }
    return this.mapRelation(relation);
  }

  async findNeighborhood(
    conceptId: string,
    depth: number,
  ): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }> {
    const visitedIds = new Set<string>();
    const allRelations: ConceptRelationEntity[] = [];
    let currentIds = [conceptId];

    for (let d = 0; d < depth; d++) {
      if (currentIds.length === 0) break;

      const relations = await this.prisma.conceptRelation.findMany({
        where: {
          OR: [
            { fromConceptId: { in: currentIds } },
            { toConceptId: { in: currentIds } },
          ],
        },
      });

      const nextIds: string[] = [];
      for (const r of relations) {
        const mapped = this.mapRelation(r);
        if (mapped) {
          allRelations.push(mapped);
        }

        if (!visitedIds.has(r.fromConceptId)) {
          visitedIds.add(r.fromConceptId);
          nextIds.push(r.fromConceptId);
        }
        if (!visitedIds.has(r.toConceptId)) {
          visitedIds.add(r.toConceptId);
          nextIds.push(r.toConceptId);
        }
      }
      for (const id of currentIds) {
        visitedIds.add(id);
      }
      currentIds = nextIds;
    }

    visitedIds.add(conceptId);
    const concepts = await this.prisma.concept.findMany({
      where: { id: { in: [...visitedIds] } },
    });

    return {
      concepts: concepts.map((c) => ({ id: c.id, label: c.label })),
      relations: allRelations,
    };
  }

  async countChunksForConcept(conceptId: string): Promise<number> {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
    });
    if (!concept) return 0;

    const count = await this.prisma.conceptChunk.count({
      where: {
        conceptId: concept.id,
      },
    });
    return count;
  }

  async linkConceptToChunk(conceptId: string, chunkId: string): Promise<void> {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
    });

    if (!concept) {
      throw new Error(`Concept with id ${conceptId} not found`);
    }

    await this.prisma.conceptChunk.upsert({
      where: {
        chunkId_conceptId: {
          chunkId,
          conceptId: concept.id,
        },
      },
      update: {},
      create: {
        chunkId,
        conceptId: concept.id,
      },
    });
  }

  async findAssociatedChunks(conceptId: string): Promise<
    Array<{
      id: string;
      content: string;
      documentId: string;
      documentTitle: string;
    }>
  > {
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
    });
    if (!concept) return [];

    const conceptChunks = await this.prisma.conceptChunk.findMany({
      where: {
        conceptId: concept.id,
      },
      include: {
        chunk: {
          include: {
            document: true,
          },
        },
      },
      take: 5,
    });

    return conceptChunks.map((cc) => ({
      id: cc.chunk.id,
      content: cc.chunk.content,
      documentId: cc.chunk.document.id,
      documentTitle: cc.chunk.document.title,
    }));
  }

  async getRootConcept(): Promise<ConceptEntity> {
    const label = 'user brain';
    let concept = await this.prisma.concept.findUnique({
      where: { label },
    });
    if (!concept) {
      concept = await this.prisma.concept.create({
        data: { id: randomUUID(), label },
      });
    }
    return { id: concept.id, label: concept.label };
  }

  async detectCycle(
    fromId: string,
    toId: string,
    relationTypes: RelationType[] = [],
    maxDepth: number = 5,
  ): Promise<boolean> {
    // We are trying to add: fromId -> toId.
    // A cycle occurs if there is already a path: toId -> ... -> fromId
    // We do a bounded BFS from `toId` looking for `fromId`.

    if (fromId === toId) return true; // Self-loop is a cycle

    let currentLevelIds = [toId];
    const visited = new Set<string>([toId]);

    for (let depth = 0; depth < maxDepth; depth++) {
      if (currentLevelIds.length === 0) break;

      // Find all outgoing relations from current level
      // Specifically focusing on hierarchical ones, but we check all for safety if we are enforcing strict DAG
      const outgoing = await this.prisma.conceptRelation.findMany({
        where: {
          fromConceptId: { in: currentLevelIds },
          ...(relationTypes.length > 0
            ? { relationType: { in: relationTypes } }
            : {}),
        },
        select: { toConceptId: true },
      });

      const nextLevelIds: string[] = [];
      for (const rel of outgoing) {
        if (rel.toConceptId === fromId) {
          return true; // Cycle detected
        }
        if (!visited.has(rel.toConceptId)) {
          visited.add(rel.toConceptId);
          nextLevelIds.push(rel.toConceptId);
        }
      }
      currentLevelIds = nextLevelIds;
    }

    return false; // No cycle detected within maxDepth
  }

  async deleteRelation(relationId: string): Promise<void> {
    await this.prisma.conceptRelation.delete({
      where: { id: relationId },
    });
  }

  async deleteConcept(conceptId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.conceptChunk.deleteMany({
        where: { conceptId },
      });
      await tx.conceptRelation.deleteMany({
        where: {
          OR: [{ fromConceptId: conceptId }, { toConceptId: conceptId }],
        },
      });
      await tx.concept.deleteMany({
        where: { id: conceptId },
      });
    });
  }
}
