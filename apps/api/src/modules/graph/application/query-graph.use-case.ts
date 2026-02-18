import type { ConceptRepository } from "../domain/concept-repository.interface.js";
import type { GraphResponse } from "@repo/shared-types";

export class QueryGraphUseCase {
  constructor(private readonly conceptRepository: ConceptRepository) {}

  async execute(): Promise<GraphResponse> {
    const concepts = await this.conceptRepository.findAll();
    const relations = await this.conceptRepository.findAllRelations();

    const nodes = await Promise.all(
      concepts.map(async (c) => ({
        id: c.id,
        label: c.label,
        chunkCount: await this.conceptRepository.countChunksForConcept(c.id),
      }))
    );

    const edges = relations.map((r) => ({
      fromId: r.fromConceptId,
      toId: r.toConceptId,
      relationType: r.relationType,
    }));

    return { nodes, edges };
  }
}
