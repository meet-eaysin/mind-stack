import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import {
  INGESTION_QUEUE,
  IngestionJobProducer,
} from '../ingestion-job.producer.js';
import { PrismaDocumentRepository } from '../prisma-document.repository.js';
import { PrismaChunkRepository } from '../../../knowledge/infrastructure/prisma-chunk.repository.js';
import { BuildGraphUseCase } from '../../../graph/application/build-graph.use-case.js';
import { JOB_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import { createLogger } from '@repo/logger';
import { EMBEDDING_PROVIDER, VECTOR_STORE } from '../../../../common/tokens.js';
import type { EmbeddingProvider, EmbeddingResult } from '@repo/embeddings';
import type { VectorStore } from '@repo/vector-store';
import type { IngestionJob } from '../../domain/ingestion-job.types.js';

@Injectable()
@Processor(INGESTION_QUEUE)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = createLogger('IngestionProcessor');

  constructor(
    @Inject(PrismaDocumentRepository)
    private readonly documentRepository: PrismaDocumentRepository,
    @Inject(IngestionJobProducer)
    private readonly jobProducer: IngestionJobProducer,
    @Inject(PrismaChunkRepository)
    private readonly chunkRepository: PrismaChunkRepository,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
    @Inject(BuildGraphUseCase)
    private readonly buildGraph: BuildGraphUseCase,
  ) {
    super();
    this.logger.info('IngestionProcessor (Unified) initialized');
  }

  async process(job: IngestionJob): Promise<void> {
    const { documentId } = job.data;
    this.logger.info(`Processing ${job.name} job for document: ${documentId}`);

    switch (job.name) {
      case JOB_TYPE.CHUNKING:
        return this.handleChunking(documentId, job.data.rawContent);
      case JOB_TYPE.EMBEDDING:
        return this.handleEmbedding(documentId);
      case JOB_TYPE.CONCEPT_EXTRACTION:
        return this.handleConceptExtraction(documentId);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleChunking(
    documentId: string,
    rawContent?: string,
  ): Promise<void> {
    try {
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.CHUNKING,
      );

      const doc = await this.documentRepository.findById(documentId);
      if (!doc) throw new Error(`Document not found: ${documentId}`);

      const content = rawContent || doc.rawContent;
      const chunks = this.splitIntoChunks(content);

      await this.chunkRepository.deleteByDocumentId(documentId);
      await this.chunkRepository.createMany(documentId, chunks);
      await this.jobProducer.enqueueEmbeddingJob(documentId);

      this.logger.info(`Completed chunking for document: ${documentId}`);
    } catch (error) {
      this.handleError(documentId, 'chunking', error);
      throw error;
    }
  }

  private async handleEmbedding(documentId: string): Promise<void> {
    try {
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.EMBEDDING,
      );

      const chunksWithMeta =
        await this.chunkRepository.findByDocumentId(documentId);
      if (chunksWithMeta.length === 0) {
        await this.documentRepository.updateStatus(
          documentId,
          INGESTION_STATUS.READY,
        );
        return;
      }

      const texts = chunksWithMeta.map((c) => c.content);
      const embeddingResults = await this.embeddingProvider.embedBatch(texts);

      const vectorDocs = chunksWithMeta.map((cwm, i) => {
        const result: EmbeddingResult | undefined = embeddingResults[i];
        if (!result) {
          throw new Error(`Failed to generate embedding for chunk: ${cwm.id}`);
        }
        return {
          id: cwm.id,
          embedding: result.embedding,
          content: cwm.content,
          metadata: {
            documentId: documentId,
            startOffset: cwm.startOffset,
            endOffset: cwm.endOffset,
          },
        };
      });

      await this.vectorStore.upsert(vectorDocs);
      await this.jobProducer.enqueueConceptExtractionJob(documentId);

      this.logger.info(`Completed embedding for document: ${documentId}`);
    } catch (error) {
      this.handleError(documentId, 'embedding', error);
      throw error;
    }
  }

  private async handleConceptExtraction(documentId: string): Promise<void> {
    try {
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.GRAPH_BUILDING,
      );

      const chunksWithMeta =
        await this.chunkRepository.findByDocumentId(documentId);
      for (const cwm of chunksWithMeta) {
        await this.buildGraph.execute({
          chunkId: cwm.id,
          chunkContent: cwm.content,
        });
      }

      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.READY,
      );
      this.logger.info(
        `Completed concept extraction for document: ${documentId}`,
      );
    } catch (error) {
      this.handleError(documentId, 'concept extraction', error);
      throw error;
    }
  }

  private splitIntoChunks(text: string, chunkSize = 1000, overlap = 200) {
    const chunks: Array<{
      content: string;
      startOffset: number;
      endOffset: number;
    }> = [];
    if (!text) return chunks;
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push({
        content: text.slice(start, end),
        startOffset: start,
        endOffset: end,
      });
      if (end === text.length) break;
      start += chunkSize - overlap;
    }
    return chunks;
  }

  private handleError(documentId: string, phase: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Failed ${phase} for document ${documentId}: ${message}`);
    this.documentRepository
      .updateStatus(documentId, INGESTION_STATUS.FAILED)
      .catch(() => {});
  }
}
