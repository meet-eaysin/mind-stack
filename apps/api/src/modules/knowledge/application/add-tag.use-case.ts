import type { TagRepository } from '@/modules/knowledge/domain/tag-repository.interface';

export class AddTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: { documentId: string; tagName: string }): Promise<void> {
    const tag = await this.tagRepository.findOrCreate(input.tagName);
    await this.tagRepository.addTagToDocument(input.documentId, tag.id);
  }
}
