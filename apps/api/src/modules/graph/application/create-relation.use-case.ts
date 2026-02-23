import { BadRequestException } from '@nestjs/common';
import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { RelationType } from '@repo/shared-types';
import {
  DOCUMENT_RELATION_TYPES,
  HIERARCHY_RELATION_TYPES,
  ROOT_NODE_ID,
  toDocumentNodeLabel,
} from '../domain/document-graph.js';

export class CreateRelationUseCase {
  constructor(
    private readonly conceptRepository: ConceptRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(input: {
    fromId: string;
    toId: string;
    type: RelationType;
    userId: string;
  }): Promise<void> {
    if (input.fromId === input.toId) {
      throw new BadRequestException('Cannot create self relation');
    }

    if (!DOCUMENT_RELATION_TYPES.includes(input.type)) {
      throw new BadRequestException('Unsupported relation type');
    }

    if (input.fromId === ROOT_NODE_ID) {
      throw new BadRequestException('Root cannot be a child relation');
    }

    const root = await this.conceptRepository.getRootConcept();
    const fromDocument = await this.documentRepository.findById(input.fromId);
    if (!fromDocument || fromDocument.userId !== input.userId) {
      throw new BadRequestException('Source document not found');
    }

    const fromConcept = await this.conceptRepository.findOrCreate(
      toDocumentNodeLabel(fromDocument.id),
    );

    let toConcept = root;
    if (input.toId !== ROOT_NODE_ID) {
      const targetDocument = await this.documentRepository.findById(input.toId);
      if (!targetDocument || targetDocument.userId !== input.userId) {
        throw new BadRequestException('Target document not found');
      }
      toConcept = await this.conceptRepository.findOrCreate(
        toDocumentNodeLabel(targetDocument.id),
      );
    }

    if (HIERARCHY_RELATION_TYPES.includes(input.type)) {
      const existing = await this.conceptRepository.findRelationsForConcept(
        fromConcept.id,
      );
      const existingParent = existing.find(
        (rel) =>
          rel.fromConceptId === fromConcept.id &&
          HIERARCHY_RELATION_TYPES.includes(rel.relationType),
      );

      if (existingParent && existingParent.toConceptId !== toConcept.id) {
        await this.conceptRepository.deleteRelation(existingParent.id);
      }

      const hasCycle = await this.conceptRepository.detectCycle(
        fromConcept.id,
        toConcept.id,
        HIERARCHY_RELATION_TYPES,
        10,
      );

      if (hasCycle) {
        throw new BadRequestException(
          'Relation would create a hierarchy cycle',
        );
      }
    }

    await this.conceptRepository.createRelation(
      fromConcept.id,
      toConcept.id,
      input.type,
    );
  }
}
