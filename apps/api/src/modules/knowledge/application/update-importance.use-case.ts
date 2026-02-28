import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import { BadRequestException } from '@nestjs/common';

export class UpdateImportanceUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(input: { documentId: string; score: number }): Promise<void> {
    if (input.score < 1 || input.score > 5) {
      throw new BadRequestException('Importance score must be between 1 and 5');
    }
    await this.documentRepository.updateImportance(
      input.documentId,
      input.score,
    );
  }
}
