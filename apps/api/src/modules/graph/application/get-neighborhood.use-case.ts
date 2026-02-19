import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { GraphResponse } from '@repo/shared-types';

export class GetNeighborhoodUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(input: {
    conceptId: string;
    depth?: number;
  }): Promise<GraphResponse> {
    const depth = input.depth ?? 2;
    const { concepts, relations } =
      await this.conceptRepository.findNeighborhood(input.conceptId, depth);

    const nodes = await Promise.all(
      concepts.map(async (c) => ({
        id: c.id,
        label: c.label,
        chunkCount: await this.conceptRepository.countChunksForConcept(c.id),
      })),
    );

    const edges = relations.map((r) => ({
      fromId: r.fromConceptId,
      toId: r.toConceptId,
      relationType: r.relationType,
    }));

    return { nodes, edges };
  }
}
