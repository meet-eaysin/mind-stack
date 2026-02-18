import type { ChunkRepository } from "../domain/chunk-repository.interface.js";

export class UpdateImportanceUseCase {
  constructor(private readonly chunkRepository: ChunkRepository) {}

  async execute(input: {
    chunkId: string;
    score: number;
  }): Promise<void> {
    if (input.score < 1 || input.score > 5) {
      throw new Error("Importance score must be between 1 and 5");
    }
    await this.chunkRepository.updateImportance(input.chunkId, input.score);
  }
}
