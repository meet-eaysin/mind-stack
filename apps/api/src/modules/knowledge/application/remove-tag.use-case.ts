import type { TagRepository } from "../domain/tag-repository.interface.js";

export class RemoveTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: {
    chunkId: string;
    tagName: string;
  }): Promise<void> {
    await this.tagRepository.removeTagFromChunk(
      input.chunkId,
      input.tagName
    );
  }
}
