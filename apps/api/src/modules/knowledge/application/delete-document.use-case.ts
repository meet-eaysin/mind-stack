import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { ChunkRepository } from '@/modules/knowledge/domain/chunk-repository.interface';
import type { VectorStore } from '@repo/vector-store';
import type { ConceptRepository } from '@/modules/graph/domain/concept-repository.interface';
import {
  HIERARCHY_RELATION_TYPES,
  toDocumentNodeLabel,
} from '@/modules/graph/domain/document-graph';

export class DeleteDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly vectorStore: VectorStore,
    private readonly conceptRepository: ConceptRepository,
  ) {}

  async execute(documentId: string): Promise<void> {
    // 1. Fetch chunks to delete them from vector store
    const chunks = await this.chunkRepository.findByDocumentId(documentId);

    // 2. Delete embeddings from ChromaDB
    const chunkIds = chunks.map((c) => c.id);
    if (chunkIds.length > 0) {
      await this.vectorStore.delete(chunkIds);
    }

    // 3. Delete chunks from database
    await this.chunkRepository.deleteByDocumentId(documentId);

    // 4. Reattach graph children and delete graph node
    const root = await this.conceptRepository.getRootConcept();
    const concept = await this.conceptRepository.findByLabel(
      toDocumentNodeLabel(documentId),
    );

    if (concept) {
      const relations = await this.conceptRepository.findRelationsForConcept(
        concept.id,
      );
      const parentRelation = relations.find(
        (rel) =>
          rel.fromConceptId === concept.id &&
          HIERARCHY_RELATION_TYPES.includes(rel.relationType),
      );
      const parentId = parentRelation?.toConceptId ?? root.id;

      const childRelations = relations.filter(
        (rel) =>
          rel.toConceptId === concept.id &&
          HIERARCHY_RELATION_TYPES.includes(rel.relationType),
      );

      for (const rel of childRelations) {
        await this.conceptRepository.createRelation(
          rel.fromConceptId,
          parentId,
          rel.relationType,
        );
        await this.conceptRepository.deleteRelation(rel.id);
      }

      await this.conceptRepository.deleteConcept(concept.id);
    }

    // 5. Delete document from database (soft delete)
    await this.documentRepository.delete(documentId);
  }
}
