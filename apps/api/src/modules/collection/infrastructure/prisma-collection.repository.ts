import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  CollectionRepository,
  CollectionWithItems,
} from '../domain/collection-repository.interface.js';
import type {
  CollectionEntity,
  CollectionItemEntity,
} from '../domain/collection.entity.js';
import { Prisma } from '@prisma/client'; // Added for explicit Prisma types

@Injectable()
export class PrismaCollectionRepository implements CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(collection: CollectionEntity): Promise<CollectionEntity> {
    const saved = await this.prisma.collection.create({
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        goal: collection.goal,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
    return saved;
  }

  async findById(id: string): Promise<CollectionEntity | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });
    return collection;
  }

  async findWithItems(id: string): Promise<CollectionWithItems | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        items: {
          where: {
            document: {
              deletedAt: null,
            },
          },
          include: {
            document: {
              select: {
                title: true,
                learningStatus: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!collection) return null;

    type CollectionItemWithDocument = Prisma.CollectionItemGetPayload<{
      include: {
        document: {
          select: {
            title: true;
            learningStatus: true;
          };
        };
      };
    }>;

    return {
      ...collection,
      description: collection.description ?? null,
      goal: collection.goal ?? null,
      items: collection.items.map((item: CollectionItemWithDocument) => ({
        id: item.id,
        collectionId: item.collectionId,
        documentId: item.documentId,
        order: item.order,
        prerequisiteId: item.prerequisiteId,
        documentTitle: item.document.title,
        learningStatus: item.document.learningStatus,
      })),
    };
  }

  async findAll(): Promise<
    (CollectionEntity & { itemCount: number; progress: number })[]
  > {
    const collections = await this.prisma.collection.findMany({
      include: {
        items: {
          where: {
            document: {
              deletedAt: null,
            },
          },
          include: {
            document: {
              select: {
                learningStatus: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    type CollectionWithItemsAndDocumentStatus = Prisma.CollectionGetPayload<{
      include: {
        items: {
          include: {
            document: {
              select: {
                learningStatus: true;
              };
            };
          };
        };
      };
    }>;

    type CollectionItemWithLearningStatus = Prisma.CollectionItemGetPayload<{
      include: {
        document: {
          select: {
            learningStatus: true;
          };
        };
      };
    }>;

    return collections.map((c: CollectionWithItemsAndDocumentStatus) => {
      const items = c.items;
      const itemCount = items.length;
      const completedCount = items.filter(
        (i: CollectionItemWithLearningStatus) =>
          i.document.learningStatus === 'COMPLETED',
      ).length;
      const progress = itemCount > 0 ? (completedCount / itemCount) * 100 : 0;

      return {
        id: c.id,
        name: c.name,
        description: c.description ?? null,
        goal: c.goal ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        itemCount,
        progress,
      };
    });
  }

  async update(
    id: string,
    data: Partial<CollectionEntity>,
  ): Promise<CollectionEntity> {
    const updateData: Prisma.CollectionUpdateInput = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.goal !== undefined) updateData.goal = data.goal;

    const updated = await this.prisma.collection.update({
      where: { id },
      data: updateData,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.collection.delete({
      where: { id },
    });
  }

  async addItem(
    item: Omit<CollectionItemEntity, 'id'>,
  ): Promise<CollectionItemEntity> {
    const saved = await this.prisma.collectionItem.create({
      data: {
        collectionId: item.collectionId,
        documentId: item.documentId,
        order: item.order,
        prerequisiteId: item.prerequisiteId,
      },
    });
    return saved;
  }

  async removeItem(id: string): Promise<void> {
    await this.prisma.collectionItem.delete({
      where: { id },
    });
  }

  async updateItemOrder(id: string, order: number): Promise<void> {
    await this.prisma.collectionItem.update({
      where: { id },
      data: { order },
    });
  }

  async findItemByCollectionAndDocument(
    collectionId: string,
    documentId: string,
  ): Promise<CollectionItemEntity | null> {
    const item = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_documentId: {
          collectionId,
          documentId,
        },
      },
    });
    return item;
  }
}
