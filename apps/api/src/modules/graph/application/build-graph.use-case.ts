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
      'Return ONLY a valid JSON array of objects. NO explanation, NO conversational filler.',
      'Example Format:',
      '[',
      '  {',
      '    "label": "Vector Search",',
      '    "relations": [',
      '      { "target": "Embeddings", "type": "DEPENDS_ON" },',
      '      { "target": "Similarity Search", "type": "RELATES_TO" }',
      '    ]',
      '  }',
      ']',
      '',
      'Available Relation Types: RELATES_TO, IS_PART_OF, DEPENDS_ON, SIMILAR_TO, LEADS_TO',
    ].join('\n');

    const response = await this.llmProvider.generate({
      prompt: content.substring(0, 2000),
      systemPrompt,
      temperature: 0.1,
    });

    try {
      let rawBody = response.text.trim();
      console.log(`GRAPH_EXTRACT: Raw LLM Response: "${rawBody}"`);

      // Handle markdown code blocks
      if (rawBody.includes('```')) {
        const match = rawBody.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match && match[1]) {
          rawBody = match[1].trim();
        }
      }

      if (!rawBody.startsWith('[')) {
        throw new Error(
          `Invalid JSON format from LLM: ${rawBody.substring(0, 50)}...`,
        );
      }

      const parsed: unknown = JSON.parse(rawBody);
      const validated = ExtractedConceptsSchema.parse(parsed);
      console.log(
        `GRAPH_EXTRACT: Successfully extracted ${validated.length} concepts`,
      );
      return validated;
    } catch (error) {
      throw new Error(
        `Graph extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
