import type { ConceptRepository } from '../domain/concept-repository.interface';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface';
import { createLogger } from '@repo/logger';
import { RELATION_TYPE } from '@repo/shared-types';
import {
  DOCUMENT_RELATION_TYPES,
  HIERARCHY_RELATION_TYPES,
  ROOT_LABEL,
  toDocumentNodeLabel,
  parseDocumentIdFromLabel,
} from '../domain/document-graph';
import { NotFoundException } from '@nestjs/common';

export class BuildGraphUseCase {
  private readonly logger = createLogger('BuildGraphUseCase');

  constructor(
    private readonly conceptRepository: ConceptRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(input: {
    documentId?: string;
    forceRebuild?: boolean;
    userId?: string;
  }): Promise<void> {
    const root = await this.conceptRepository.getRootConcept();
    const shouldCleanup = input.forceRebuild ?? true;

    if (root.label !== ROOT_LABEL) {
      this.logger.warn(`Root label mismatch: ${root.label}`);
    }

    if (shouldCleanup) {
      await this.cleanupNonDocumentNodes(root.id);
    }

    const documents = await this.resolveScopedDocuments(input);

    const docIdToConceptId = new Map<string, string>();
    for (const doc of documents) {
      const concept = await this.conceptRepository.findOrCreate(
        toDocumentNodeLabel(doc.id),
      );
      docIdToConceptId.set(doc.id, concept.id);
    }

    const allRelations = await this.conceptRepository.findAllRelations();
    const conceptIdToDocId = new Map<string, string>();
    const allConcepts = await this.conceptRepository.findAll();

    for (const concept of allConcepts) {
      const docId = parseDocumentIdFromLabel(concept.label);
      if (docId) {
        conceptIdToDocId.set(concept.id, docId);
      }
    }

    // Cleanup relations that target non-document nodes or unsupported types
    for (const relation of allRelations) {
      const fromDocId = conceptIdToDocId.get(relation.fromConceptId);
      const toDocId = conceptIdToDocId.get(relation.toConceptId);
      const isRoot = relation.toConceptId === root.id;

      const allowedType = DOCUMENT_RELATION_TYPES.includes(
        relation.relationType,
      );

      if (relation.fromConceptId === root.id) {
        await this.conceptRepository.deleteRelation(relation.id);
        continue;
      }

      if (!allowedType) {
        await this.conceptRepository.deleteRelation(relation.id);
        continue;
      }

      if (isRoot && !HIERARCHY_RELATION_TYPES.includes(relation.relationType)) {
        await this.conceptRepository.deleteRelation(relation.id);
        continue;
      }

      if (!fromDocId) {
        await this.conceptRepository.deleteRelation(relation.id);
        continue;
      }

      if (!toDocId && !isRoot) {
        await this.conceptRepository.deleteRelation(relation.id);
      }
    }

    // Enforce single hierarchy parent and attach orphans to root
    for (const conceptId of docIdToConceptId.values()) {
      const relationsForDoc =
        await this.conceptRepository.findRelationsForConcept(conceptId);
      const outgoingHierarchy = relationsForDoc.filter(
        (rel) =>
          rel.fromConceptId === conceptId &&
          HIERARCHY_RELATION_TYPES.includes(rel.relationType),
      );

      if (outgoingHierarchy.length > 1) {
        const sorted = [...outgoingHierarchy].sort((a, b) =>
          a.id.localeCompare(b.id),
        );
        const toRemove = sorted.slice(1);
        for (const rel of toRemove) {
          await this.conceptRepository.deleteRelation(rel.id);
        }
      }

      const hasHierarchyParent = outgoingHierarchy.length > 0;
      if (!hasHierarchyParent) {
        await this.conceptRepository.createRelation(
          conceptId,
          root.id,
          RELATION_TYPE.IS_PART_OF,
        );
      }
    }
  }

  private async cleanupNonDocumentNodes(rootId: string): Promise<void> {
    const concepts = await this.conceptRepository.findAll();
    for (const concept of concepts) {
      if (concept.id === rootId) continue;
      const docId = parseDocumentIdFromLabel(concept.label);
      if (!docId) {
        await this.conceptRepository.deleteConcept(concept.id);
      }
    }
  }

  private async resolveScopedDocuments(input: {
    documentId?: string;
    userId?: string;
  }): ReturnType<DocumentRepository['findAll']> {
    const allDocuments = await this.documentRepository.findAll();

    if (input.documentId) {
      const scopedDocument = allDocuments.find(
        (document) => document.id === input.documentId,
      );
      if (!scopedDocument) {
        throw new NotFoundException(`Document not found: ${input.documentId}`);
      }
      if (input.userId && scopedDocument.userId !== input.userId) {
        throw new NotFoundException(`Document not found: ${input.documentId}`);
      }
      return allDocuments.filter(
        (document) => document.userId === scopedDocument.userId,
      );
    }

    if (input.userId) {
      return allDocuments.filter(
        (document) => document.userId === input.userId,
      );
    }

    return allDocuments;
  }
}
