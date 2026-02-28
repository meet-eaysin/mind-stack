import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  LearningGoalRepository,
  LearningGoalWithItems,
} from '@/modules/learning-goal/domain/learning-goal-repository.interface';
import type {
  LearningGoalEntity,
  LearningGoalItemEntity,
} from '@/modules/learning-goal/domain/learning-goal.entity';
import { Prisma } from '@repo/database';

@Injectable()
export class PrismaLearningGoalRepository implements LearningGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(goal: LearningGoalEntity): Promise<LearningGoalEntity> {
    const saved = await this.prisma.learningGoal.create({
      data: {
        id: goal.id,
        name: goal.name,
        deadline: goal.deadline,
        progress: goal.progress,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
    });
    return saved;
  }

  async findById(id: string): Promise<LearningGoalEntity | null> {
    const goal = await this.prisma.learningGoal.findUnique({
      where: { id },
    });
    return goal;
  }

  async findWithItems(id: string): Promise<LearningGoalWithItems | null> {
    const goal = await this.prisma.learningGoal.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            collection: {
              select: { name: true },
            },
            document: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!goal) return null;

    return {
      id: goal.id,
      name: goal.name,
      deadline: goal.deadline,
      progress: goal.progress,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      items: (goal.items || []).map((item) => ({
        id: item.id,
        goalId: item.goalId,
        collectionId: item.collectionId,
        documentId: item.documentId,
        collectionName: item.collection?.name ?? null,
        documentTitle: item.document?.title ?? null,
      })),
    };
  }

  async findAll(): Promise<(LearningGoalEntity & { itemCount: number })[]> {
    const goals = await this.prisma.learningGoal.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return goals.map((g) => ({
      id: g.id,
      name: g.name,
      deadline: g.deadline,
      progress: g.progress,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      itemCount: g._count.items,
    }));
  }

  async update(
    id: string,
    data: Partial<LearningGoalEntity>,
  ): Promise<LearningGoalEntity> {
    const updateData: Prisma.LearningGoalUpdateInput = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.progress !== undefined) updateData.progress = data.progress;

    const updated = await this.prisma.learningGoal.update({
      where: { id },
      data: updateData,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.learningGoal.delete({
      where: { id },
    });
  }

  async addItem(
    item: Omit<LearningGoalItemEntity, 'id'>,
  ): Promise<LearningGoalItemEntity> {
    const saved = await this.prisma.learningGoalItem.create({
      data: {
        goalId: item.goalId,
        collectionId: item.collectionId,
        documentId: item.documentId,
      },
    });
    return {
      id: saved.id,
      goalId: saved.goalId,
      collectionId: saved.collectionId,
      documentId: saved.documentId,
    };
  }

  async removeItem(id: string): Promise<void> {
    await this.prisma.learningGoalItem.delete({
      where: { id },
    });
  }

  async findItemByGoalAndCollection(
    goalId: string,
    collectionId: string,
  ): Promise<LearningGoalItemEntity | null> {
    const item = await this.prisma.learningGoalItem.findFirst({
      where: { goalId, collectionId },
    });
    if (!item) return null;
    return {
      id: item.id,
      goalId: item.goalId,
      collectionId: item.collectionId,
      documentId: item.documentId,
    };
  }

  async findItemByGoalAndDocument(
    goalId: string,
    documentId: string,
  ): Promise<LearningGoalItemEntity | null> {
    const item = await this.prisma.learningGoalItem.findFirst({
      where: { goalId, documentId },
    });
    if (!item) return null;
    return {
      id: item.id,
      goalId: item.goalId,
      collectionId: item.collectionId,
      documentId: item.documentId,
    };
  }
}
