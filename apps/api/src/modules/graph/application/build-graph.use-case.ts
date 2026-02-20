import { z } from 'zod';
import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { LLMProvider } from '@repo/llm';
import { type RelationType, RELATION_TYPE } from '@repo/shared-types';

type ExtractedConcept = {
  label: string;
  relations: Array<{
    target: string;
    type: RelationType;
  }>;
};

const ExtractedConceptSchema = z.object({
  label: z.string(),
  relations: z.array(
    z.object({
      target: z.string(),
      type: z.enum([
        RELATION_TYPE.RELATES_TO,
        RELATION_TYPE.IS_PART_OF,
        RELATION_TYPE.DEPENDS_ON,
        RELATION_TYPE.SIMILAR_TO,
        RELATION_TYPE.LEADS_TO,
      ] as const),
    }),
  ),
});

const ExtractedConceptsSchema = z.array(ExtractedConceptSchema);

export class BuildGraphUseCase {
  constructor(
    private readonly conceptRepository: ConceptRepository,
    private readonly llmProvider: LLMProvider,
  ) {}

  async execute(input: {
    chunkContent: string;
    chunkId: string;
  }): Promise<void> {
    const extracted = await this.extractConcepts(input.chunkContent);

    for (const concept of extracted) {
      const source = await this.conceptRepository.findOrCreate(concept.label);
      await this.conceptRepository.linkConceptToChunk(source.id, input.chunkId);

      for (const relation of concept.relations) {
        const target = await this.conceptRepository.findOrCreate(
          relation.target,
        );
        await this.conceptRepository.createRelation(
          source.id,
          target.id,
          relation.type,
        );
      }
    }
  }

  private async extractConcepts(content: string): Promise<ExtractedConcept[]> {
    const systemPrompt = [
      'Extract key technical concepts and their relationships from the text.',
      'Return a JSON array of objects with:',
      '  - "label": concept name (string)',
      '  - "relations": array of { "target": string, "type": "RELATES_TO" | "IS_PART_OF" | "DEPENDS_ON" | "SIMILAR_TO" | "LEADS_TO" }',
      'Return ONLY valid JSON, no markdown or explanation.',
    ].join('\n');

    const response = await this.llmProvider.generate({
      prompt: content.substring(0, 2000),
      systemPrompt,
      temperature: 0.1,
    });

    try {
      const rawBody = response.text.trim();
      // Basic check for JSON array
      if (!rawBody.startsWith('[')) return [];

      const parsed: unknown = JSON.parse(rawBody);
      return ExtractedConceptsSchema.parse(parsed);
    } catch (_error) {
      // In case of LLM hallucination or invalid JSON, return empty
      return [];
    }
  }
}
