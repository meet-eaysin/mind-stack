import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LearningGoalRepository } from '@/modules/learning-goal/domain/learning-goal-repository.interface';
import { CollectionRepository } from '@/modules/collection/domain/collection-repository.interface';
import { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';

@Injectable()
export class AddItemToLearningGoalUseCase {
  constructor(
    private readonly goalRepository: LearningGoalRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(input: {
    goalId: string;
    collectionId?: string;
    documentId?: string;
  }): Promise<void> {
    if (!input.collectionId && !input.documentId) {
      throw new BadRequestException(
        'Either collectionId or documentId must be provided',
      );
    }

    const goal = await this.goalRepository.findById(input.goalId);
    if (!goal) {
      throw new NotFoundException(
        `Learning Goal with ID ${input.goalId} not found`,
      );
    }

    if (input.collectionId) {
      const collection = await this.collectionRepository.findById(
        input.collectionId,
      );
      if (!collection) {
        throw new NotFoundException(
          `Collection with ID ${input.collectionId} not found`,
        );
      }

      const existing = await this.goalRepository.findItemByGoalAndCollection(
        input.goalId,
        input.collectionId,
      );
      if (existing) {
        throw new BadRequestException('Collection is already in this goal');
      }

      await this.goalRepository.addItem({
        goalId: input.goalId,
        collectionId: input.collectionId,
        documentId: null,
      });
    } else if (input.documentId) {
      const document = await this.documentRepository.findById(input.documentId);
      if (!document) {
        throw new NotFoundException(
          `Document with ID ${input.documentId} not found`,
        );
      }

      const existing = await this.goalRepository.findItemByGoalAndDocument(
        input.goalId,
        input.documentId,
      );
      if (existing) {
        throw new BadRequestException('Document is already in this goal');
      }

      await this.goalRepository.addItem({
        goalId: input.goalId,
        collectionId: null,
        documentId: input.documentId,
      });
    }
  }
}
