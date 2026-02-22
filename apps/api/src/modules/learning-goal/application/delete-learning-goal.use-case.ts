import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningGoalRepository } from '../domain/learning-goal-repository.interface.js';

@Injectable()
export class DeleteLearningGoalUseCase {
  constructor(
    private readonly learningGoalRepository: LearningGoalRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.learningGoalRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Learning Goal with ID ${id} not found`);
    }

    await this.learningGoalRepository.delete(id);
  }
}
