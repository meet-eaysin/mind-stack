import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningGoalRepository } from '@/modules/learning-goal/domain/learning-goal-repository.interface';
import type { LearningGoalEntity } from '@/modules/learning-goal/domain/learning-goal.entity';

@Injectable()
export class UpdateLearningGoalUseCase {
  constructor(
    private readonly learningGoalRepository: LearningGoalRepository,
  ) {}

  async execute(
    id: string,
    input: {
      name?: string;
      deadline?: string;
      progress?: number;
    },
  ): Promise<LearningGoalEntity> {
    const existing = await this.learningGoalRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Learning Goal with ID ${id} not found`);
    }

    const updateData: Partial<LearningGoalEntity> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.deadline !== undefined)
      updateData.deadline = input.deadline ? new Date(input.deadline) : null;
    if (input.progress !== undefined) updateData.progress = input.progress;

    return this.learningGoalRepository.update(id, updateData);
  }
}
