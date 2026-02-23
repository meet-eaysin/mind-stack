import { BuildGraphUseCase } from '../build-graph.use-case.js';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '../../domain/concept-repository.interface.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import {
  createDocument,
  type DocumentEntity,
} from '../../../ingestion/domain/document.entity.js';
import {
  ROOT_LABEL,
  toDocumentNodeLabel,
} from '../../domain/document-graph.js';
import type {
  RelationType,
  IngestionStatus,
  LearningStatus,
} from '@repo/shared-types';

class FakeDocumentRepository implements DocumentRepository {
  private documents = new Map<string, DocumentEntity>();

  seed(docs: DocumentEntity[]): void {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
  }

  save(document: DocumentEntity): Promise<DocumentEntity> {
    this.documents.set(document.id, document);
    return Promise.resolve(document);
  }

  findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.documents.get(id) ?? null);
  }

  findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve([...this.documents.values()]);
  }

  findBySourceUrl(
    _url: string,
    _userId: string,
  ): Promise<DocumentEntity | null> {
    return Promise.resolve(null);
  }

  updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    return Promise.resolve();
  }
  updateProcessingError(
    _id: string,
    _errorMessage: string | null,
  ): Promise<void> {
    return Promise.resolve();
  }

  updateImportance(_id: string, _score: number): Promise<void> {
    return Promise.resolve();
  }

  getImportance(_id: string): Promise<number | null> {
    return Promise.resolve(null);
  }

  delete(id: string): Promise<void> {
    this.documents.delete(id);
    return Promise.resolve();
  }

  addStatusHistory(
    _documentId: string,
    _status: IngestionStatus,
    _learningStatus: LearningStatus,
  ): Promise<void> {
    return Promise.resolve();
  }
}

class FakeConceptRepository implements ConceptRepository {
  private concepts = new Map<string, ConceptEntity>();
  private relations: ConceptRelationEntity[] = [];
  private idCounter = 0;

  findById(id: string): Promise<ConceptEntity | null> {
    return Promise.resolve(this.concepts.get(id) ?? null);
  }

  findByLabel(label: string): Promise<ConceptEntity | null> {
    for (const concept of this.concepts.values()) {
      if (concept.label === label) return Promise.resolve(concept);
    }
    return Promise.resolve(null);
  }

  findOrCreate(label: string): Promise<ConceptEntity> {
    const existing = [...this.concepts.values()].find((c) => c.label === label);
    if (existing) return Promise.resolve(existing);
    const concept = { id: `concept-${++this.idCounter}`, label };
    this.concepts.set(concept.id, concept);
    return Promise.resolve(concept);
  }

  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
    const existing = this.relations.find(
      (r) =>
        r.fromConceptId === fromId &&
        r.toConceptId === toId &&
        r.relationType === relationType,
    );
    if (existing) return Promise.resolve(existing);
    const relation = {
      id: `rel-${this.relations.length + 1}`,
      fromConceptId: fromId,
      toConceptId: toId,
      relationType,
    };
    this.relations.push(relation);
    return Promise.resolve(relation);
  }

  findRelationsForConcept(conceptId: string): Promise<ConceptRelationEntity[]> {
    return Promise.resolve(
      this.relations.filter(
        (r) => r.fromConceptId === conceptId || r.toConceptId === conceptId,
      ),
    );
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

  findAssociatedChunks(): Promise<
    { id: string; content: string; documentTitle: string; documentId: string }[]
  > {
    return Promise.resolve([]);
  }

  async getRootConcept(): Promise<ConceptEntity> {
    const existing = await this.findByLabel(ROOT_LABEL);
    if (existing) return existing;
    const concept = { id: `concept-${++this.idCounter}`, label: ROOT_LABEL };
    this.concepts.set(concept.id, concept);
    return concept;
  }

  findRelationById(relationId: string): Promise<ConceptRelationEntity | null> {
    return Promise.resolve(
      this.relations.find((relation) => relation.id === relationId) ?? null,
    );
  }

  detectCycle(): Promise<boolean> {
    return Promise.resolve(false);
  }

  deleteRelation(relationId: string): Promise<void> {
    this.relations = this.relations.filter((r) => r.id !== relationId);
    return Promise.resolve();
  }

  deleteConcept(conceptId: string): Promise<void> {
    this.concepts.delete(conceptId);
    this.relations = this.relations.filter(
      (r) => r.fromConceptId !== conceptId && r.toConceptId !== conceptId,
    );
    return Promise.resolve();
  }

  getRelations(): ConceptRelationEntity[] {
    return this.relations;
  }
}

describe('BuildGraphUseCase', () => {
  let useCase: BuildGraphUseCase;
  let conceptRepository: FakeConceptRepository;
  let documentRepository: FakeDocumentRepository;

  beforeEach(() => {
    conceptRepository = new FakeConceptRepository();
    documentRepository = new FakeDocumentRepository();
    useCase = new BuildGraphUseCase(conceptRepository, documentRepository);
  });

  it('attaches orphan documents to root', async () => {
    documentRepository.seed([
      createDocument({
        id: 'doc-1',
        title: 'Document 1',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
    ]);

    await useCase.execute({});

    const root = await conceptRepository.getRootConcept();
    const docConcept = await conceptRepository.findByLabel(
      toDocumentNodeLabel('doc-1'),
    );

    expect(docConcept).not.toBeNull();
    expect(
      conceptRepository
        .getRelations()
        .some(
          (rel) =>
            rel.fromConceptId === docConcept?.id &&
            rel.toConceptId === root.id &&
            rel.relationType === 'IS_PART_OF',
        ),
    ).toBe(true);
  });

  it('removes unsupported relation types', async () => {
    documentRepository.seed([
      createDocument({
        id: 'doc-1',
        title: 'Document 1',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
      createDocument({
        id: 'doc-2',
        title: 'Document 2',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
    ]);

    const doc1 = await conceptRepository.findOrCreate(
      toDocumentNodeLabel('doc-1'),
    );
    const doc2 = await conceptRepository.findOrCreate(
      toDocumentNodeLabel('doc-2'),
    );
    await conceptRepository.createRelation(doc1.id, doc2.id, 'RELATES_TO');

    await useCase.execute({});

    const relations = conceptRepository.getRelations();
    expect(relations.some((rel) => rel.relationType === 'RELATES_TO')).toBe(
      false,
    );
  });

  it('reattaches unrelated documents to root during document-scoped rebuild', async () => {
    documentRepository.seed([
      createDocument({
        id: 'doc-1',
        title: 'Document 1',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
      createDocument({
        id: 'doc-2',
        title: 'Document 2',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
    ]);

    const doc2 = await conceptRepository.findOrCreate(
      toDocumentNodeLabel('doc-2'),
    );
    const root = await conceptRepository.getRootConcept();
    await conceptRepository.createRelation(doc2.id, root.id, 'IS_PART_OF');
    const relation = conceptRepository
      .getRelations()
      .find((item) => item.fromConceptId === doc2.id);
    if (relation) {
      await conceptRepository.deleteRelation(relation.id);
    }

    await useCase.execute({ documentId: 'doc-1' });

    const relations = conceptRepository.getRelations();
    expect(
      relations.some(
        (item) =>
          item.fromConceptId === doc2.id &&
          item.toConceptId === root.id &&
          item.relationType === 'IS_PART_OF',
      ),
    ).toBe(true);
  });
});
