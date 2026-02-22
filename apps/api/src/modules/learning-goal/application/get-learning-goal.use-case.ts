import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningGoalRepository } from '../domain/learning-goal-repository.interface.js';
import type { LearningGoalDetailResponse } from '@repo/shared-types';

@Injectable()
export class GetLearningGoalUseCase {
  constructor(
    private readonly learningGoalRepository: LearningGoalRepository,
  ) {}

  async execute(id: string): Promise<LearningGoalDetailResponse> {
    const goal = await this.learningGoalRepository.findWithItems(id);

    if (!goal) {
      throw new NotFoundException(`Learning Goal with ID ${id} not found`);
    }

    return {
      id: goal.id,
      name: goal.name,
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      progress: goal.progress,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      items: goal.items.map((item) => ({
        id: item.id,
        collectionId: item.collectionId,
        collectionName: item.collectionName ?? null,
        documentId: item.documentId,
        documentTitle: item.documentTitle ?? null,
      })),
    };
  }
}
