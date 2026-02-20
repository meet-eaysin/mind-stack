import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { INGESTION_QUEUE } from '../ingestion-job.producer.js';
import { PrismaDocumentRepository } from '../prisma-document.repository.js';
import { PrismaChunkRepository } from '../../../knowledge/infrastructure/prisma-chunk.repository.js';
import { IngestionJobProducer } from '../ingestion-job.producer.js';
import { JOB_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import { createLogger } from '@repo/logger';
import type { IngestionJob } from '../../domain/ingestion-job.types.js';

@Injectable()
@Processor(INGESTION_QUEUE)
export class ChunkingProcessor extends WorkerHost {
  private readonly logger = createLogger('ChunkingProcessor');

  constructor(
    @Inject(PrismaDocumentRepository)
    private readonly documentRepository: PrismaDocumentRepository,
    @Inject(IngestionJobProducer)
    private readonly jobProducer: IngestionJobProducer,
    @Inject(PrismaChunkRepository)
    private readonly chunkRepository: PrismaChunkRepository,
  ) {
    super();
  }

  async process(job: IngestionJob): Promise<void> {
    if (job.name !== JOB_TYPE.CHUNKING) {
      return;
    }

    const { documentId } = job.data;
    this.logger.info(`Processing chunking job for document: ${documentId}`);

    try {
      // 1. Update status
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.CHUNKING,
      );

      // 2. Fetch document
      const doc = await this.documentRepository.findById(documentId);
      if (!doc) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // 3. Split into chunks
      const chunks = this.splitIntoChunks(doc.rawContent);
      this.logger.info(
        `Split document ${documentId} into ${chunks.length} chunks`,
      );

      // 4. Save chunks
      await this.chunkRepository.createMany(documentId, chunks);

      // 5. Enqueue embedding job
      await this.jobProducer.enqueueEmbeddingJob(documentId);

      this.logger.info(
        `Successfully completed chunking for document: ${documentId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process chunking job for document ${documentId}: ${errorMessage}`,
      );
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.FAILED,
      );
      throw error;
    }
  }

  private splitIntoChunks(
    text: string,
    chunkSize: number = 1000,
    overlap: number = 200,
  ): Array<{ content: string; startOffset: number; endOffset: number }> {
    const chunks: Array<{
      content: string;
      startOffset: number;
      endOffset: number;
    }> = [];
    if (!text) return chunks;

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const content = text.slice(start, end);
      chunks.push({
        content,
        startOffset: start,
        endOffset: end,
      });
      if (end === text.length) break;
      start += chunkSize - overlap;
    }

    return chunks;
  }
}
