import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { TagRepository } from '../domain/tag-repository.interface.js';
import type { TagEntity } from '../domain/tag.entity.js';

@Injectable()
export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(name: string): Promise<TagEntity> {
    const existing = await this.prisma.tag.findUnique({
      where: { name },
    });
    if (existing) return { id: existing.id, name: existing.name };

    const created = await this.prisma.tag.create({
      data: { id: randomUUID(), name },
    });
    return { id: created.id, name: created.name };
  }

  async addTagToChunk(chunkId: string, tagId: string): Promise<void> {
    await this.prisma.chunkTag.upsert({
      where: { chunkId_tagId: { chunkId, tagId } },
      create: { chunkId, tagId },
      update: {},
    });
  }

  async removeTagFromChunk(chunkId: string, tagName: string): Promise<void> {
    const tag = await this.prisma.tag.findUnique({
      where: { name: tagName },
    });
    if (!tag) return;

    await this.prisma.chunkTag.deleteMany({
      where: { chunkId, tagId: tag.id },
    });
  }

  async findByChunkId(chunkId: string): Promise<TagEntity[]> {
    const rows = await this.prisma.chunkTag.findMany({
      where: { chunkId },
      include: { tag: true },
    });
    return rows.map((r) => ({ id: r.tag.id, name: r.tag.name }));
  }
}
