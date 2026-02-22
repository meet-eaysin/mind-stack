import { Injectable } from '@nestjs/common';
import { LearningGoalRepository } from '../domain/learning-goal-repository.interface.js';
import type { LearningGoalListItem } from '@repo/shared-types';

@Injectable()
export class ListLearningGoalsUseCase {
  constructor(
    private readonly learningGoalRepository: LearningGoalRepository,
  ) {}

  async execute(): Promise<LearningGoalListItem[]> {
    const goals = await this.learningGoalRepository.findAll();

    return goals.map((g) => ({
      id: g.id,
      name: g.name,
      deadline: g.deadline ? g.deadline.toISOString() : null,
      progress: g.progress,
      itemCount: g.itemCount,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));
  }
}
