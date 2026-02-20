import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../domain/concept-repository.interface.js';
import type { RelationType } from '@repo/shared-types';

@Injectable()
export class PrismaConceptRepository implements ConceptRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRelation(r: {
    id: string;
    fromConceptId: string;
    toConceptId: string;
    relationType: string;
  }): ConceptRelationEntity {
    return {
      id: r.id,
      fromConceptId: r.fromConceptId,
      toConceptId: r.toConceptId,
      relationType: r.relationType as RelationType,
    };
  }

  async findOrCreate(label: string): Promise<ConceptEntity> {
    const existing = await this.prisma.concept.findUnique({
      where: { label },
    });
    if (existing) return { id: existing.id, label: existing.label };

    const created = await this.prisma.concept.create({
      data: { id: randomUUID(), label },
    });
    return { id: created.id, label: created.label };
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
      return this.mapRelation(existing);
    }

    const created = await this.prisma.conceptRelation.create({
      data: {
        id: randomUUID(),
        fromConceptId: fromId,
        toConceptId: toId,
        relationType,
      },
    });

    return this.mapRelation(created);
  }

  async findAll(): Promise<ConceptEntity[]> {
    const rows = await this.prisma.concept.findMany();
    return rows.map((r) => ({ id: r.id, label: r.label }));
  }

  async findAllRelations(): Promise<ConceptRelationEntity[]> {
    const rows = await this.prisma.conceptRelation.findMany();
    return rows.map((r) => this.mapRelation(r));
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
        allRelations.push(mapped);

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

    const count = await this.prisma.chunkTag.count({
      where: {
        tag: { name: concept.label },
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

    // Upsert a Tag using the concept's label to satisfy the schema definition
    const tag = await this.prisma.tag.upsert({
      where: { name: concept.label },
      update: {},
      create: { id: randomUUID(), name: concept.label },
    });

    // Link the Chunk to the Tag if it doesn't exist
    await this.prisma.chunkTag.upsert({
      where: {
        chunkId_tagId: {
          chunkId,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        chunkId,
        tagId: tag.id,
      },
    });
  }
}
