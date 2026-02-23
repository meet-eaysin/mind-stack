import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { JOB_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import type { EmbeddingProvider } from '@repo/embeddings';
import type { VectorStore, VectorDocument } from '@repo/vector-store';
import { EMBEDDING_PROVIDER, VECTOR_STORE } from '../../../common/tokens.js';
import type { IngestionJob } from '../domain/ingestion-job.types.js';
import { PrismaDocumentRepository } from './prisma-document.repository.js';
import { PrismaChunkRepository } from '../../knowledge/infrastructure/prisma-chunk.repository.js';
import { BuildGraphUseCase } from '../../graph/application/build-graph.use-case.js';
import {
  IngestionJobProducer,
  INGESTION_QUEUE,
} from './ingestion-job.producer.js';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

@Processor(INGESTION_QUEUE)
export class IngestionProcessor extends WorkerHost {
  constructor(
    private readonly documentRepository: PrismaDocumentRepository,
    private readonly chunkRepository: PrismaChunkRepository,
    private readonly buildGraph: BuildGraphUseCase,
    private readonly jobProducer: IngestionJobProducer,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
  ) {
    super();
  }

  async process(job: IngestionJob): Promise<void> {
    const jobType = this.toJobType(job.name);
    const { documentId } = job.data;

    try {
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
      await this.transition(documentId, INGESTION_STATUS.FAILED);
      throw error;
    }
  }

  private async processUrlExtraction(documentId: string): Promise<void> {
    await this.transition(documentId, INGESTION_STATUS.INITIALIZING);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
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

    await this.jobProducer.enqueueChunkingJob(documentId);
  }

  private async processChunking(documentId: string): Promise<void> {
    await this.transition(documentId, INGESTION_STATUS.CHUNKING);

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    if (!document.rawContent.trim()) {
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
    await this.jobProducer.enqueueEmbeddingJob(documentId);
  }

  private async processEmbedding(documentId: string): Promise<void> {
    await this.transition(documentId, INGESTION_STATUS.EMBEDDING);

    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    if (chunks.length === 0) {
      throw new Error(`No chunks found for embedding: ${documentId}`);
    }

    const embeddings = await this.embeddingProvider.embedBatch(
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
    await this.jobProducer.enqueueConceptExtractionJob(documentId);
  }

  private async processConceptExtraction(documentId: string): Promise<void> {
    await this.transition(documentId, INGESTION_STATUS.GRAPH_BUILDING);

    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    for (const chunk of chunks) {
      await this.buildGraph.execute({
        chunkContent: chunk.content,
        chunkId: chunk.id,
      });
    }

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
}
