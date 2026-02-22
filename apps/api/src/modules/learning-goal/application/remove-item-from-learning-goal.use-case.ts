import { Injectable } from '@nestjs/common';
import { LearningGoalRepository } from '../domain/learning-goal-repository.interface.js';

@Injectable()
export class RemoveItemFromLearningGoalUseCase {
  constructor(
    private readonly learningGoalRepository: LearningGoalRepository,
  ) {}

  async execute(itemId: string): Promise<void> {
    // Note: itemId is the LearningGoalItem ID, not collectionId or documentId
    await this.learningGoalRepository.removeItem(itemId);
  }
}
