import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { LLMProvider } from '@repo/llm';
import { ExtractedConceptsSchema } from './dto/extraction.dto.js';
import { ExtractedConcept } from '../domain/graph.types.js';
import { createLogger } from '@repo/logger';

export class BuildGraphUseCase {
  private readonly logger = createLogger('BuildGraphUseCase');

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
    try {
      const response = await this.llmProvider.generate({
        prompt: `Chunk Content: "${content.substring(0, 3000)}"`,
        systemPrompt: [
          'Extract technical concepts and their relations from the text.',
          'Format: Array of objects [{ "label": "Concept", "relations": [{ "target": "Other", "type": "RELATES_TO" }] }]',
          'Relation Types: RELATES_TO, IS_PART_OF, DEPENDS_ON, SIMILAR_TO, LEADS_TO',
          'Output Rule: JSON ONLY. NO preamble. NO code blocks.',
        ].join('\n'),
        temperature: 0,
        responseFormat: 'json',
      });

      let rawBody = response.text.trim();
      this.logger.info(`Raw LLM Response: "${rawBody}"`);

      // Clean LLM debris (code blocks)
      if (rawBody.includes('```')) {
        const match = rawBody.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match && match[1]) {
          rawBody = match[1].trim();
        }
      }

      // Find the actual start of JSON (either [ or {)
      const firstArray = rawBody.indexOf('[');
      const firstObject = rawBody.indexOf('{');

      let startIdx = -1;
      if (firstArray !== -1 && firstObject !== -1) {
        startIdx = Math.min(firstArray, firstObject);
      } else if (firstArray !== -1) {
        startIdx = firstArray;
      } else if (firstObject !== -1) {
        startIdx = firstObject;
      }

      if (startIdx !== -1) {
        rawBody = rawBody.substring(startIdx);
        // Find the matching end
        const lastArray = rawBody.lastIndexOf(']');
        const lastObject = rawBody.lastIndexOf('}');
        const endIdx = Math.max(lastArray, lastObject);
        if (endIdx !== -1) {
          rawBody = rawBody.substring(0, endIdx + 1);
        }
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch (e) {
        this.logger.error(`JSON Parse failed for response: ${rawBody}`);
        throw e;
      }

      // Handle single object response from small models
      const normalized = Array.isArray(parsed) ? parsed : [parsed];
      const validated = ExtractedConceptsSchema.parse(normalized);

      this.logger.info(`Successfully extracted ${validated.length} concepts`);
      return validated as ExtractedConcept[];
    } catch (error) {
      this.logger.error(
        `GRAPH_EXTRACT: Failed to parse concepts: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
