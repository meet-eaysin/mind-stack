import { BadRequestException } from '@nestjs/common';
import { CreateRelationUseCase } from '../create-relation.use-case.js';
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
    for (const doc of docs) this.documents.set(doc.id, doc);
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
  private concepts: ConceptEntity[] = [];
  private relations: ConceptRelationEntity[] = [];
  private idCounter = 0;
  private cycleResult = false;

  setCycleResult(value: boolean): void {
    this.cycleResult = value;
  }

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
  detectCycle(): Promise<boolean> {
    return Promise.resolve(this.cycleResult);
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

describe('CreateRelationUseCase', () => {
  it('rejects self relation', async () => {
    const conceptRepo = new FakeConceptRepository();
    const documentRepo = new FakeDocumentRepository();
    const useCase = new CreateRelationUseCase(conceptRepo, documentRepo);

    await expect(
      useCase.execute({
        fromId: 'doc-1',
        toId: 'doc-1',
        type: 'IS_PART_OF',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported relation type', async () => {
    const conceptRepo = new FakeConceptRepository();
    const documentRepo = new FakeDocumentRepository();
    documentRepo.seed([
      createDocument({
        id: 'doc-1',
        title: 'Doc 1',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
      createDocument({
        id: 'doc-2',
        title: 'Doc 2',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
    ]);

    const useCase = new CreateRelationUseCase(conceptRepo, documentRepo);

    await expect(
      useCase.execute({
        fromId: 'doc-1',
        toId: 'doc-2',
        type: 'RELATES_TO',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects hierarchy cycles', async () => {
    const conceptRepo = new FakeConceptRepository();
    conceptRepo.setCycleResult(true);
    const documentRepo = new FakeDocumentRepository();
    documentRepo.seed([
      createDocument({
        id: 'doc-1',
        title: 'Doc 1',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
      createDocument({
        id: 'doc-2',
        title: 'Doc 2',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'content',
      }),
    ]);

    await conceptRepo.findOrCreate(toDocumentNodeLabel('doc-1'));
    await conceptRepo.findOrCreate(toDocumentNodeLabel('doc-2'));

    const useCase = new CreateRelationUseCase(conceptRepo, documentRepo);

    await expect(
      useCase.execute({
        fromId: 'doc-1',
        toId: 'doc-2',
        type: 'IS_PART_OF',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
