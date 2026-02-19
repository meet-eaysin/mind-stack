import type { TagRepository } from '../domain/tag-repository.interface.js';

export class AddTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: { chunkId: string; tagName: string }): Promise<void> {
    const tag = await this.tagRepository.findOrCreate(input.tagName);
    await this.tagRepository.addTagToChunk(input.chunkId, tag.id);
  }
}
