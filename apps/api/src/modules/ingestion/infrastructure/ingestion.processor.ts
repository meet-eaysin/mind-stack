import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { JOB_TYPE, INGESTION_STATUS, SOURCE_TYPE } from '@repo/shared-types';
import type { VectorStore, VectorDocument } from '@repo/vector-store';
import { VECTOR_STORE } from '@/common/tokens';
import type { IngestionJob } from '@/modules/ingestion/domain/ingestion-job.types';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import { PrismaChunkRepository } from '@/modules/knowledge/infrastructure/prisma-chunk.repository';
import { BuildGraphUseCase } from '@/modules/graph/application/build-graph.use-case';
import {
  IngestionJobProducer,
  INGESTION_QUEUE,
} from '@/modules/ingestion/infrastructure/ingestion-job.producer';
import { LlmProviderFactory } from '@/modules/settings/application/llm-provider.factory';
import { CheckEmbeddingModelUseCase } from '@/modules/settings/application/check-embedding-model.use-case';
import { createLogger } from '@repo/logger';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const logger = createLogger('IngestionProcessor');

@Processor(INGESTION_QUEUE)
export class IngestionProcessor extends WorkerHost {
  constructor(
    private readonly documentRepository: PrismaDocumentRepository,
    private readonly chunkRepository: PrismaChunkRepository,
    private readonly buildGraph: BuildGraphUseCase,
    private readonly jobProducer: IngestionJobProducer,
    private readonly providerFactory: LlmProviderFactory,
    private readonly checkEmbeddingModel: CheckEmbeddingModelUseCase,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
  ) {
    super();
  }

  async process(job: IngestionJob): Promise<void> {
    const jobType = this.toJobType(job.name);
    const { documentId } = job.data;

    logger.info('Processing ingestion job', {
      jobType,
      documentId,
    });

    try {
      await this.documentRepository.updateProcessingError(documentId, null);
      if (jobType === JOB_TYPE.URL_EXTRACTION) {
        await this.processUrlExtraction(documentId);
        return;
      }
      if (jobType === JOB_TYPE.CHUNKING) {
        await this.processChunking(documentId);
        return;
      }
      if (jobType === JOB_TYPE.EMBEDDING) {
        await this.processEmbedding(documentId);
        return;
      }
      if (jobType === JOB_TYPE.CONCEPT_EXTRACTION) {
        await this.processConceptExtraction(documentId);
        return;
      }

      throw new Error(`Unsupported ingestion job type: ${jobType}`);
    } catch (error) {
      const raw =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error';
      const message = this.formatErrorMessage(raw);
      const maxAttempts = this.getAttempts(job);
      const attemptNumber = job.attemptsMade + 1;
      const willRetry = attemptNumber < maxAttempts;

      await this.documentRepository.updateProcessingError(documentId, message);

      if (willRetry) {
        logger.warn('Ingestion job failed; retry scheduled', {
          jobType,
          documentId,
          attempt: attemptNumber,
          maxAttempts,
          error: message,
        });
      } else {
        await this.transition(documentId, INGESTION_STATUS.FAILED);
        logger.error('Ingestion job failed', {
          jobType,
          documentId,
          error: message,
        });
      }
      throw error;
    }
  }

  private async processUrlExtraction(documentId: string): Promise<void> {
    await this.transition(documentId, INGESTION_STATUS.INITIALIZING);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    if (document.sourceType !== SOURCE_TYPE.URL) {
      logger.warn('Skipping URL extraction for non-URL source', {
        documentId,
        sourceType: document.sourceType,
      });
      return;
    }
    if (!document.sourceUrl) {
      throw new Error(`URL extraction requires sourceUrl: ${documentId}`);
    }

    const response = await fetch(document.sourceUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL content (${response.status}): ${document.sourceUrl}`,
      );
    }

    const html = await response.text();
    const extracted = this.extractTextFromHtml(html);
    if (!extracted) {
      throw new Error(`No extractable text found: ${document.sourceUrl}`);
    }

    await this.documentRepository.save({
      ...document,
      rawContent: extracted,
    });

    await this.jobProducer.enqueueChunkingJob(documentId, document.userId);
  }

  private async processChunking(documentId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    const allowedStatuses: string[] = [
      INGESTION_STATUS.INGESTED,
      INGESTION_STATUS.INITIALIZING,
      INGESTION_STATUS.CHUNKING,
    ];
    if (!allowedStatuses.includes(document.status)) {
      logger.warn('Skipping chunking for document in incompatible status', {
        documentId,
        status: document.status,
      });
      return;
    }

    await this.transition(documentId, INGESTION_STATUS.CHUNKING);

    if (!document.rawContent.trim()) {
      if (document.sourceType === SOURCE_TYPE.URL && document.sourceUrl) {
        logger.warn(
          'Chunking received URL document with empty content; re-queueing URL extraction',
          { documentId },
        );
        await this.transition(documentId, INGESTION_STATUS.INITIALIZING);
        await this.jobProducer.enqueueUrlExtractionJob(
          documentId,
          document.userId,
        );
        return;
      }
      throw new Error(`Document has empty content: ${documentId}`);
    }

    const existingChunks =
      await this.chunkRepository.findByDocumentId(documentId);
    if (existingChunks.length > 0) {
      await this.vectorStore.delete(existingChunks.map((chunk) => chunk.id));
      await this.chunkRepository.deleteByDocumentId(documentId);
    }

    const chunks = this.splitTextIntoChunks(document.rawContent);
    if (chunks.length === 0) {
      throw new Error(`Failed to produce chunks for document: ${documentId}`);
    }

    await this.chunkRepository.createMany(documentId, chunks);
    await this.jobProducer.enqueueEmbeddingJob(documentId, document.userId);
  }

  private async processEmbedding(documentId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    const allowedStatuses: string[] = [
      INGESTION_STATUS.CHUNKING,
      INGESTION_STATUS.EMBEDDING,
    ];
    if (!allowedStatuses.includes(document.status)) {
      logger.warn('Skipping embedding for document in incompatible status', {
        documentId,
        status: document.status,
      });
      return;
    }

    await this.transition(documentId, INGESTION_STATUS.EMBEDDING);

    const health = await this.checkEmbeddingModel.execute(document.userId);
    if (!health.available) {
      throw new Error(health.reason ?? 'Embedding model not available');
    }

    const embeddingProvider = await this.providerFactory.getEmbeddingProvider(
      document.userId,
    );

    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    if (chunks.length === 0) {
      if (document.rawContent.trim().length > 0) {
        logger.warn(
          'Embedding received document without chunks; re-queueing chunking',
          { documentId },
        );
        await this.jobProducer.enqueueChunkingJob(documentId, document.userId);
        return;
      }
      throw new Error(`No chunks found for embedding: ${documentId}`);
    }

    const embeddings = await embeddingProvider.embedBatch(
      chunks.map((chunk) => chunk.content),
    );

    const vectorDocs: VectorDocument[] = chunks.map((chunk, index) => {
      const vector = embeddings[index];
      if (!vector) {
        throw new Error(`Missing embedding for chunk: ${chunk.id}`);
      }
      return {
        id: chunk.id,
        content: chunk.content,
        embedding: vector.embedding,
        metadata: { documentId },
      };
    });

    await this.vectorStore.upsert(vectorDocs);
    await this.jobProducer.enqueueConceptExtractionJob(
      documentId,
      document.userId,
    );
  }

  private async processConceptExtraction(documentId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    const allowedStatuses: string[] = [
      INGESTION_STATUS.EMBEDDING,
      INGESTION_STATUS.GRAPH_BUILDING,
    ];
    if (!allowedStatuses.includes(document.status)) {
      logger.warn(
        'Skipping concept extraction for document in incompatible status',
        {
          documentId,
          status: document.status,
        },
      );
      return;
    }

    await this.transition(documentId, INGESTION_STATUS.GRAPH_BUILDING);

    await this.buildGraph.execute({ documentId });

    await this.transition(documentId, INGESTION_STATUS.READY);
  }

  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toJobType(value: string): string {
    const supportedJobTypes: string[] = Object.values(JOB_TYPE);
    if (!supportedJobTypes.includes(value)) {
      throw new Error(`Unsupported ingestion job type: ${value}`);
    }
    return value;
  }

  private splitTextIntoChunks(
    content: string,
  ): Array<{ content: string; startOffset: number; endOffset: number }> {
    const chunks: Array<{
      content: string;
      startOffset: number;
      endOffset: number;
    }> = [];
    const normalized = content.trim();
    if (!normalized) {
      return chunks;
    }

    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(start + CHUNK_SIZE, normalized.length);
      const chunkContent = normalized.slice(start, end).trim();
      if (chunkContent) {
        chunks.push({
          content: chunkContent,
          startOffset: start,
          endOffset: end,
        });
      }

      if (end === normalized.length) {
        break;
      }
      start = Math.max(end - CHUNK_OVERLAP, start + 1);
    }

    return chunks;
  }

  private async transition(
    documentId: string,
    status: (typeof INGESTION_STATUS)[keyof typeof INGESTION_STATUS],
  ): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      return;
    }

    await this.documentRepository.updateStatus(documentId, status);
    await this.documentRepository.addStatusHistory(
      documentId,
      status,
      document.learningStatus,
    );
  }

  private formatErrorMessage(message: string): string {
    const trimmed = message.trim();
    if (trimmed.length <= 300) return trimmed;
    return `${trimmed.slice(0, 300)}…`;
  }

  private getAttempts(job: IngestionJob): number {
    const value = job.opts.attempts;
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }
    return 1;
  }
}
