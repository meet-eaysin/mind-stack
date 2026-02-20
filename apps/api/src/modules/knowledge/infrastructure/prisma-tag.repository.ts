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

  async addTagToDocument(documentId: string, tagId: string): Promise<void> {
    await this.prisma.documentTag.upsert({
      where: { documentId_tagId: { documentId, tagId } },
      create: { documentId, tagId },
      update: {},
    });
  }

  async removeTagFromDocument(
    documentId: string,
    tagName: string,
  ): Promise<void> {
    const tag = await this.prisma.tag.findUnique({
      where: { name: tagName },
    });
    if (!tag) return;

    await this.prisma.documentTag.deleteMany({
      where: { documentId, tagId: tag.id },
    });
  }

  async findByDocumentId(documentId: string): Promise<TagEntity[]> {
    const rows = await this.prisma.documentTag.findMany({
      where: { documentId },
      include: { tag: true },
    });
    return rows.map((r) => ({ id: r.tag.id, name: r.tag.name }));
  }
}
