import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LearningGoalRepository } from '@/modules/learning-goal/domain/learning-goal-repository.interface';
import type { LearningGoalEntity } from '@/modules/learning-goal/domain/learning-goal.entity';

@Injectable()
export class CreateLearningGoalUseCase {
  constructor(
    private readonly learningGoalRepository: LearningGoalRepository,
  ) {}

  async execute(input: {
    name: string;
    deadline?: string;
  }): Promise<LearningGoalEntity> {
    const goal: LearningGoalEntity = {
      id: randomUUID(),
      name: input.name,
      deadline: input.deadline ? new Date(input.deadline) : null,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.learningGoalRepository.save(goal);
  }
}
