import { QueryGraphUseCase } from '@/modules/graph/application/query-graph.use-case';
import type {
  ConceptRepository,
  ConceptEntity,
  ConceptRelationEntity,
} from '@/modules/graph/domain/concept-repository.interface';
import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { ChunkRepository } from '@/modules/knowledge/domain/chunk-repository.interface';
import {
  createDocument,
  type DocumentEntity,
} from '@/modules/ingestion/domain/document.entity';
import {
  ROOT_LABEL,
  toDocumentNodeLabel,
} from '@/modules/graph/domain/document-graph';
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

class FakeChunkRepository implements ChunkRepository {
  private counts = new Map<string, number>();
  seedCount(documentId: string, count: number): void {
    this.counts.set(documentId, count);
  }
  findByDocumentId(documentId: string) {
    const count = this.counts.get(documentId) ?? 0;
    return Promise.resolve(
      Array.from({ length: count }).map((_, index) => ({
        id: `${documentId}-chunk-${index}`,
        documentId,
        content: `chunk-${index}`,
        startOffset: index,
        endOffset: index + 1,
        createdAt: new Date(),
      })),
    );
  }
  findById(): Promise<null> {
    return Promise.resolve(null);
  }
  countByDocumentId(documentId: string): Promise<number> {
    return Promise.resolve(this.counts.get(documentId) ?? 0);
  }
  createMany(): Promise<
    Array<{
      id: string;
      documentId: string;
      content: string;
      startOffset: number;
      endOffset: number;
      createdAt: Date;
    }>
  > {
    return Promise.resolve([]);
  }
  deleteByDocumentId(): Promise<void> {
    return Promise.resolve();
  }
}

class FakeConceptRepository implements ConceptRepository {
  private concepts: ConceptEntity[] = [];
  private relations: ConceptRelationEntity[] = [];
  private idCounter = 0;

  findById(id: string): Promise<ConceptEntity | null> {
    return Promise.resolve(this.concepts.find((c) => c.id === id) ?? null);
  }
  findByLabel(label: string): Promise<ConceptEntity | null> {
    return Promise.resolve(
      this.concepts.find((c) => c.label === label) ?? null,
    );
  }
  findOrCreate(label: string): Promise<ConceptEntity> {
    const existing = this.concepts.find((c) => c.label === label);
    if (existing) return Promise.resolve(existing);
    const concept = { id: `concept-${++this.idCounter}`, label };
    this.concepts.push(concept);
    return Promise.resolve(concept);
  }
  createRelation(
    fromId: string,
    toId: string,
    relationType: RelationType,
  ): Promise<ConceptRelationEntity> {
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
    return Promise.resolve(this.concepts);
  }
  findAllRelations(): Promise<ConceptRelationEntity[]> {
    return Promise.resolve(this.relations);
  }
  findNeighborhood(): Promise<{
    concepts: ConceptEntity[];
    relations: ConceptRelationEntity[];
  }> {
    return Promise.resolve({ concepts: [], relations: [] });
  }
  countChunksForConcept(): Promise<number> {
    return Promise.resolve(0);
  }
  linkConceptToChunk(): Promise<void> {
    return Promise.resolve();
  }
  findAssociatedChunks(): Promise<
    { id: string; content: string; documentTitle: string; documentId: string }[]
  > {
    return Promise.resolve([]);
  }
  async getRootConcept(): Promise<ConceptEntity> {
    const existing = this.concepts.find((c) => c.label === ROOT_LABEL);
    if (existing) return existing;
    const concept = { id: `concept-${++this.idCounter}`, label: ROOT_LABEL };
    this.concepts.push(concept);
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
    this.concepts = this.concepts.filter((c) => c.id !== conceptId);
    this.relations = this.relations.filter(
      (r) => r.fromConceptId !== conceptId && r.toConceptId !== conceptId,
    );
    return Promise.resolve();
  }
}

describe('QueryGraphUseCase', () => {
  it('returns document nodes with root and filters unsupported relations', async () => {
    const conceptRepository = new FakeConceptRepository();
    const documentRepository = new FakeDocumentRepository();
    const chunkRepository = new FakeChunkRepository();
    const useCase = new QueryGraphUseCase(
      conceptRepository,
      documentRepository,
      chunkRepository,
    );

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
    chunkRepository.seedCount('doc-1', 3);
    chunkRepository.seedCount('doc-2', 1);

    const doc1 = await conceptRepository.findOrCreate(
      toDocumentNodeLabel('doc-1'),
    );
    const doc2 = await conceptRepository.findOrCreate(
      toDocumentNodeLabel('doc-2'),
    );
    const root = await conceptRepository.getRootConcept();
    await conceptRepository.createRelation(doc1.id, root.id, 'IS_PART_OF');
    await conceptRepository.createRelation(doc1.id, doc2.id, 'RELATES_TO');

    const result = await useCase.execute({ userId: 'default' });

    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.find((n) => n.id === 'doc-1')?.chunkCount).toBe(3);
    expect(result.nodes.find((n) => n.id === 'doc-2')?.chunkCount).toBe(1);
    expect(result.nodes.find((n) => n.id === 'root')?.label).toBe(ROOT_LABEL);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.fromId).toBe('doc-1');
    expect(result.edges[0]?.toId).toBe('root');
  });
});
