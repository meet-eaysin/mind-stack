import { BuildGraphUseCase } from '../build-graph.use-case.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../../domain/concept-repository.interface.js';
import type {
  LLMProvider,
  GenerationRequest,
  GenerationResponse,
  StreamChunk,
} from '@repo/llm';
import { type RelationType } from '@repo/shared-types';

class FakeLLMProvider implements LLMProvider {
  private responseText = '[]';
  setResponse(text: string): void {
    this.responseText = text;
  }
  generate(_request: GenerationRequest): Promise<GenerationResponse> {
    return Promise.resolve({
      text: this.responseText,
      finishReason: 'stop',
      tokenCount: 0,
    });
  }
  async *generateStream(
    _request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    yield { text: this.responseText, done: true };
  }
}

class FakeConceptRepository implements ConceptRepository {
  private concepts: Map<string, ConceptEntity> = new Map();
  private relations: ConceptRelationEntity[] = [];
  private idCounter = 0;

  async findOrCreate(label: string): Promise<ConceptEntity> {
    for (const c of this.concepts.values()) {
      if (c.label === label) return c;
    }
    const concept = { id: `c-${++this.idCounter}`, label };
    this.concepts.set(concept.id, concept);
    return concept;
  }

  async createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    const rel = {
      id: `r-${this.relations.length + 1}`,
      fromConceptId: fromId,
      toConceptId: toId,
      relationType,
    };
    this.relations.push(rel);
    return rel;
  }

  async findAll(): Promise<ConceptEntity[]> {
    return [...this.concepts.values()];
  }
  async findAllRelations(): Promise<ConceptRelationEntity[]> {
    return this.relations;
  }
  async findNeighborhood() {
    return { concepts: [], relations: [] };
  }
  async countChunksForConcept() {
    return 0;
  }
  async linkConceptToChunk() {}
  async findAssociatedChunks() {
    return [];
  }

  getRootConcept(): Promise<ConceptEntity> {
    const rootId = 'root-user-brain';
    const rootLabel = 'user brain';
    let root = null;
    for (const concept of this.concepts.values()) {
      if (concept.id === rootId) root = concept;
    }
    if (!root) {
      root = { id: rootId, label: rootLabel };
      this.concepts.set(rootId, root);
    }
    return Promise.resolve(root);
  }

  detectCycle(
    _fromId: string,
    _toId: string,
    _maxDepth?: number,
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  deleteRelation(relationId: string): Promise<void> {
    this.relations = this.relations.filter((r) => r.id !== relationId);
    return Promise.resolve();
  }
}

describe('Graph Stability & Error Handling', () => {
  let useCase: BuildGraphUseCase;
  let llm: FakeLLMProvider;
  let repo: FakeConceptRepository;

  beforeEach(() => {
    llm = new FakeLLMProvider();
    repo = new FakeConceptRepository();
    useCase = new BuildGraphUseCase(repo, llm);
  });

  describe('Label Normalization', () => {
    it('should merge "Machine Learning" and "machine learning"', async () => {
      llm.setResponse(
        JSON.stringify([
          { label: 'Machine Learning', relations: [] },
          { label: 'machine learning', relations: [] },
        ]),
      );

      await useCase.execute({ chunkContent: '...', chunkId: '1' });

      const concepts = await repo.findAll();
      expect(concepts).toHaveLength(2); // 1 + root concept
      expect(concepts[1]?.label).toBe('machine learning');
    });

    it('should handle complex normalization with punctuation', async () => {
      llm.setResponse(
        JSON.stringify([
          { label: 'TypeScript.', relations: [] },
          { label: '"TypeScript"', relations: [] },
        ]),
      );

      await useCase.execute({ chunkContent: '...', chunkId: '1' });

      const concepts = await repo.findAll();
      expect(concepts).toHaveLength(2); // 1 + root concept
      expect(concepts[1]?.label).toBe('typescript');
    });
  });

  describe('Robust JSON Parsing', () => {
    it('should extract JSON from markdown code blocks', async () => {
      llm.setResponse(
        'Here is the graph: \n```json\n[{"label": "React", "relations": []}]\n```',
      );

      await useCase.execute({ chunkContent: '...', chunkId: '1' });

      const concepts = await repo.findAll();
      expect(concepts).toHaveLength(2); // 1 + root concept
      expect(concepts[1]?.label).toBe('react');
    });

    it('should repair trailing commas gracefully', async () => {
      llm.setResponse('[{"label": "NestJS", "relations": [],},]');

      await useCase.execute({ chunkContent: '...', chunkId: '1' });

      const concepts = await repo.findAll();
      expect(concepts).toHaveLength(2); // 1 + root concept
      expect(concepts[1]?.label).toBe('nestjs');
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular relations (A -> B -> A)', async () => {
      llm.setResponse(
        JSON.stringify([
          { label: 'A', relations: [{ target: 'B', type: 'RELATES_TO' }] },
          { label: 'B', relations: [{ target: 'A', type: 'RELATES_TO' }] },
        ]),
      );

      await useCase.execute({ chunkContent: '...', chunkId: '1' });

      const relations = await repo.findAllRelations();
      expect(relations).toHaveLength(2);
    });

    it('should handle Unicode and Emojis', async () => {
      llm.setResponse(
        JSON.stringify([
          { label: '🚀 Speed', relations: [] },
          { label: '日本語', relations: [] },
        ]),
      );

      await useCase.execute({ chunkContent: '...', chunkId: '1' });

      const concepts = await repo.findAll();
      expect(concepts).toHaveLength(3); // 2 + root concept
    });
  });
});
