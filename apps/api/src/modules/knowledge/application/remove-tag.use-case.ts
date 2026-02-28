import type { TagRepository } from '@/modules/knowledge/domain/tag-repository.interface';

export class RemoveTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: { documentId: string; tagName: string }): Promise<void> {
    await this.tagRepository.removeTagFromDocument(
      input.documentId,
      input.tagName,
    );
  }
}
