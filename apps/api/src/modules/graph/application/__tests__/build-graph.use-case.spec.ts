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
import type { RelationType } from '@repo/shared-types';

// ── Fakes ──

class FakeLLMProvider implements LLMProvider {
  private responseText = '[]';

  setResponse(text: string): void {
    this.responseText = text;
  }

  generate(_request: GenerationRequest): Promise<GenerationResponse> {
    return Promise.resolve({
      text: this.responseText,
      finishReason: 'stop',
      tokenCount: this.responseText.split(' ').length,
    });
  }

  async *generateStream(
    _request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    await Promise.resolve();
    yield { text: this.responseText, done: true };
  }
}

class FakeConceptRepository implements ConceptRepository {
  private concepts: Map<string, ConceptEntity> = new Map();
  private relations: ConceptRelationEntity[] = [];
  private idCounter = 0;

  findOrCreate(label: string): Promise<ConceptEntity> {
    for (const concept of this.concepts.values()) {
      if (concept.label === label) return Promise.resolve(concept);
    }
    this.idCounter += 1;
    const concept: ConceptEntity = {
      id: `concept-${String(this.idCounter)}`,
      label,
    };
    this.concepts.set(concept.id, concept);
    return Promise.resolve(concept);
  }

  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    const relation: ConceptRelationEntity = {
      id: `rel-${String(this.relations.length + 1)}`,
      fromConceptId: fromId,
      toConceptId: toId,
      relationType,
    };
    this.relations.push(relation);
    return Promise.resolve(relation);
  }

  findAll(): Promise<ConceptEntity[]> {
    return Promise.resolve([...this.concepts.values()]);
  }

  findAllRelations(): Promise<ConceptRelationEntity[]> {
    return Promise.resolve(this.relations);
  }

  findNeighborhood(
    _conceptId: string,
    _depth: number,
  ): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }> {
    return Promise.resolve({ concepts: [], relations: [] });
  }

  countChunksForConcept(_conceptId: string): Promise<number> {
    return Promise.resolve(0);
  }

  linkConceptToChunk(_conceptId: string, _chunkId: string): Promise<void> {
    return Promise.resolve();
  }

  getCreatedConcepts(): ConceptEntity[] {
    return [...this.concepts.values()];
  }

  getCreatedRelations(): ConceptRelationEntity[] {
    return this.relations;
  }
  findAssociatedChunks(
    _conceptId: string,
  ): Promise<{ id: string; content: string; documentTitle: string }[]> {
    return Promise.resolve([]);
  }
}

// ── Tests ──

describe('BuildGraphUseCase', () => {
  let useCase: BuildGraphUseCase;
  let llmProvider: FakeLLMProvider;
  let conceptRepository: FakeConceptRepository;

  beforeEach(() => {
    llmProvider = new FakeLLMProvider();
    conceptRepository = new FakeConceptRepository();
    useCase = new BuildGraphUseCase(conceptRepository, llmProvider);
  });

  it('should extract concepts from LLM and create concepts with relations', async () => {
    const llmResponse = JSON.stringify([
      {
        label: 'TypeScript',
        relations: [
          { target: 'JavaScript', type: 'RELATES_TO' },
          { target: 'Node.js', type: 'DEPENDS_ON' },
        ],
      },
    ]);
    llmProvider.setResponse(llmResponse);

    await useCase.execute({
      chunkContent: 'TypeScript is a typed superset of JavaScript...',
      chunkId: 'chunk-1',
    });

    const concepts = conceptRepository.getCreatedConcepts();
    expect(concepts).toHaveLength(3);
    const labels = concepts.map((c) => c.label);
    expect(labels).toContain('typescript');
    expect(labels).toContain('javascript');
    expect(labels).toContain('node.js');

    const relations = conceptRepository.getCreatedRelations();
    expect(relations).toHaveLength(2);
  });

  it('should handle malformed LLM JSON gracefully', async () => {
    llmProvider.setResponse('not valid json');

    await useCase.execute({
      chunkContent: 'Some random content',
      chunkId: 'chunk-1',
    });

    const concepts = conceptRepository.getCreatedConcepts();
    expect(concepts).toHaveLength(0);
  });

  it('should handle empty LLM response array', async () => {
    llmProvider.setResponse('[]');

    await useCase.execute({
      chunkContent: 'Simple content',
      chunkId: 'chunk-1',
    });

    const concepts = conceptRepository.getCreatedConcepts();
    expect(concepts).toHaveLength(0);
  });
});
