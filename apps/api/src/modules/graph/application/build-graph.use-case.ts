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
      const normalizedLabel = this.normalizeLabel(concept.label);
      if (!normalizedLabel) continue;

      const source = await this.conceptRepository.findOrCreate(normalizedLabel);
      await this.conceptRepository.linkConceptToChunk(source.id, input.chunkId);

      for (const relation of concept.relations) {
        const normalizedTarget = this.normalizeLabel(relation.target);
        if (!normalizedTarget || normalizedTarget === normalizedLabel) continue;

        const target =
          await this.conceptRepository.findOrCreate(normalizedTarget);
        await this.conceptRepository.createRelation(
          source.id,
          target.id,
          relation.type,
        );
      }
    }
  }

  private normalizeLabel(label: string): string {
    return label
      .trim()
      .toLowerCase()
      .replace(/[.,;:!?]+$/, '') // Remove trailing punctuation
      .replace(/^["']|["']$/g, '') // Remove wrapping quotes
      .trim();
  }

  private async extractConcepts(content: string): Promise<ExtractedConcept[]> {
    try {
      const response = await this.llmProvider.generate({
        prompt: `Chunk Content: "${content.substring(0, 4000)}"`,
        systemPrompt: [
          'Extract technical concepts, entities, and their semantic relations from the text.',
          'Format: JSON Array of objects exactly matching this structure:',
          '[{ "label": "Concept Name", "relations": [{ "target": "Related Concept", "type": "RELATES_TO" | "IS_PART_OF" | "DEPENDS_ON" | "SIMILAR_TO" | "LEADS_TO" }] }]',
          '',
          'Guidelines:',
          '1. Focus on core technical terms, frameworks, architectural patterns, and key entities.',
          '2. Avoid generic words; capture meaningful knowledge nodes.',
          '3. Relations must be directional and semantically accurate.',
          '4. Output ONLY the JSON array. NO preamble, NO explanation, NO markdown code blocks.',
          '5. If no concepts are found, return [].',
        ].join('\n'),
        temperature: 0,
        responseFormat: 'json',
      });

      let rawBody = response.text.trim();

      // Robust JSON Repairing
      // 1. Remove markdown code blocks
      rawBody = rawBody.replace(/^```(?:json)?\n?|```$/gm, '').trim();

      // 2. Find the bounds of the JSON array or object
      const startIdx = rawBody.indexOf('[');
      const endIdx = rawBody.lastIndexOf(']');

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        rawBody = rawBody.substring(startIdx, endIdx + 1);
      }

      if (!rawBody) {
        this.logger.warn('LLM returned empty or non-JSON content');
        return [];
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch (e) {
        // Attempt minor repairs: handle trailing commas
        try {
          const repaired = rawBody.replace(/,\s*([\]}])/g, '$1');
          parsed = JSON.parse(repaired);
        } catch (_innerError) {
          this.logger.error(`JSON Parse failed even after repair: ${rawBody}`);
          throw e;
        }
      }

      const normalized = Array.isArray(parsed) ? parsed : [parsed];
      const validated = ExtractedConceptsSchema.parse(normalized);

      return validated as ExtractedConcept[];
    } catch (error) {
      this.logger.error(
        `GRAPH_EXTRACT: Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return []; // Return empty instead of throwing to prevent crashing the worker job
    }
  }
}
