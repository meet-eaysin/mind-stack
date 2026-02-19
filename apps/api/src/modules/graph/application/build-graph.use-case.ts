import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { LLMProvider } from '@repo/llm';
import type { RelationType } from '@repo/shared-types';

interface ExtractedConcept {
  label: string;
  relations: Array<{
    target: string;
    type: RelationType;
  }>;
}

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
      const parsed = JSON.parse(response.text) as ExtractedConcept[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
