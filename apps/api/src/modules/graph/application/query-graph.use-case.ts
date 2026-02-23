import type { ConceptRepository } from '../domain/concept-repository.interface.js';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { ChunkRepository } from '../../knowledge/domain/chunk-repository.interface.js';
import type { GraphResponse } from '@repo/shared-types';
import {
  ROOT_LABEL,
  ROOT_NODE_ID,
  DOCUMENT_RELATION_TYPES,
  toDocumentNodeLabel,
} from '../domain/document-graph.js';

export class QueryGraphUseCase {
  constructor(
    private readonly conceptRepository: ConceptRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
  ) {}

  async execute(): Promise<GraphResponse> {
    const root = await this.conceptRepository.getRootConcept();
    const documents = await this.documentRepository.findAll();
    const docIdToConceptId = new Map<string, string>();

    for (const doc of documents) {
      const concept = await this.conceptRepository.findOrCreate(
        toDocumentNodeLabel(doc.id),
      );
      docIdToConceptId.set(doc.id, concept.id);
    }

    const conceptIdToNodeId = new Map<string, string>();
    conceptIdToNodeId.set(root.id, ROOT_NODE_ID);
    for (const [docId, conceptId] of docIdToConceptId.entries()) {
      conceptIdToNodeId.set(conceptId, docId);
    }

    const relations = await this.conceptRepository.findAllRelations();

    const nodes = await Promise.all(
      documents.map(async (doc) => ({
        id: doc.id,
        label: doc.title,
        chunkCount: await this.chunkRepository.countByDocumentId(doc.id),
      })),
    );

    nodes.push({
      id: ROOT_NODE_ID,
      label: ROOT_LABEL,
      chunkCount: 0,
    });

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
