import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { ChunkRepository } from '../../knowledge/domain/chunk-repository.interface.js';
import type { GraphResponse } from '@repo/shared-types';
import {
  ROOT_LABEL,
  ROOT_NODE_ID,
  DOCUMENT_RELATION_TYPES,
  toDocumentNodeLabel,
  parseDocumentIdFromLabel,
} from '../domain/document-graph.js';

export class GetNeighborhoodUseCase {
  constructor(
    private readonly conceptRepository: ConceptRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async execute(input: {
    conceptId: string;
    depth?: number;
    userId: string;
  }): Promise<GraphResponse> {
    const depth = input.depth ?? 2;
    const root = await this.conceptRepository.getRootConcept();
    const rootConceptId = input.conceptId === ROOT_NODE_ID ? root.id : null;
    const documentId =
      input.conceptId !== ROOT_NODE_ID ? input.conceptId : null;

    let conceptId = rootConceptId;
    if (!conceptId && documentId) {
      const doc = await this.documentRepository.findById(documentId);
      if (!doc || doc.userId !== input.userId) {
        throw new NotFoundException('Document not found');
      }
      const concept = await this.conceptRepository.findOrCreate(
        toDocumentNodeLabel(doc.id),
      );
      conceptId = concept.id;
    }

    if (!conceptId) {
      throw new BadRequestException('Invalid graph node id');
    }

    const { concepts, relations } =
      await this.conceptRepository.findNeighborhood(conceptId, depth);

    const documentMap = new Map<string, { id: string; title: string }>();
    const allDocuments = await this.documentRepository.findAll();
    const documents = allDocuments.filter((doc) => doc.userId === input.userId);
    for (const doc of documents) {
      documentMap.set(doc.id, { id: doc.id, title: doc.title });
    }

    const conceptIdToNodeId = new Map<string, string>();
    conceptIdToNodeId.set(root.id, ROOT_NODE_ID);
    for (const concept of concepts) {
      const docId = parseDocumentIdFromLabel(concept.label);
      if (docId) {
        conceptIdToNodeId.set(concept.id, docId);
      }
    }

    const nodes: GraphResponse['nodes'] = [];
    for (const concept of concepts) {
      if (concept.id === root.id) {
        nodes.push({
          id: ROOT_NODE_ID,
          label: ROOT_LABEL,
          chunkCount: 0,
        });
        continue;
      }

      const docId = parseDocumentIdFromLabel(concept.label);
      if (!docId) continue;
      const document = documentMap.get(docId);
      if (!document) continue;
      const chunks = await this.chunkRepository.findByDocumentId(docId);
      nodes.push({
        id: docId,
        label: document.title,
        chunkCount: chunks.length,
        associatedChunks: chunks.slice(0, 5).map((chunk) => ({
          id: chunk.id,
          content: chunk.content,
          documentId: docId,
          documentTitle: document.title,
        })),
      });
    }

    const edges: GraphResponse['edges'] = [];
    for (const relation of relations) {
      if (!DOCUMENT_RELATION_TYPES.includes(relation.relationType)) continue;
      const fromId = conceptIdToNodeId.get(relation.fromConceptId);
      const toId = conceptIdToNodeId.get(relation.toConceptId);
      if (!fromId || !toId) continue;
      edges.push({
        fromId,
        toId,
        relationType: relation.relationType,
      });
    }

    return { nodes, edges };
  }
}
