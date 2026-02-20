import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { INGESTION_QUEUE } from '../ingestion-job.producer.js';
import { PrismaDocumentRepository } from '../prisma-document.repository.js';
import { PrismaChunkRepository } from '../../../knowledge/infrastructure/prisma-chunk.repository.js';
import { IngestionJobProducer } from '../ingestion-job.producer.js';
import { JOB_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import { createLogger } from '@repo/logger';
import { EMBEDDING_PROVIDER, VECTOR_STORE } from '../../../../common/tokens.js';
import type { EmbeddingProvider } from '@repo/embeddings';
import type { VectorStore } from '@repo/vector-store';
import type { IngestionJob } from '../../domain/ingestion-job.types.js';

@Injectable()
@Processor(INGESTION_QUEUE)
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = createLogger('EmbeddingProcessor');

  constructor(
    @Inject(PrismaDocumentRepository)
    private readonly documentRepository: PrismaDocumentRepository,
    @Inject(IngestionJobProducer)
    private readonly jobProducer: IngestionJobProducer,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
    @Inject(PrismaChunkRepository)
    private readonly chunkRepository: PrismaChunkRepository,
  ) {
    super();
  }

  async process(job: IngestionJob): Promise<void> {
    if (job.name !== JOB_TYPE.EMBEDDING) {
      return;
    }

    const { documentId } = job.data;
    this.logger.info(`Processing embedding job for document: ${documentId}`);

    try {
      // 1. Update status
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.EMBEDDING,
      );

      // 2. Fetch chunks
      const chunksWithMeta =
        await this.chunkRepository.findByDocumentId(documentId);
      if (chunksWithMeta.length === 0) {
        this.logger.warn(`No chunks found for document: ${documentId}`);
        await this.completeProcessing(documentId);
        return;
      }

      // 3. Generate embeddings
      const texts = chunksWithMeta.map((c) => c.chunk.content);
      const embeddingResults = await this.embeddingProvider.embedBatch(texts);

      // 4. Prepare for Vector Store
      const vectorDocs = chunksWithMeta.map((cwm, i) => {
        const result = embeddingResults[i];
        if (!result) {
          throw new Error(
            `Failed to generate embedding for chunk: ${cwm.chunk.id}`,
          );
        }
        return {
          id: cwm.chunk.id,
          embedding: result.embedding,
          content: cwm.chunk.content,
          metadata: {
            documentId: documentId,
            startOffset: cwm.chunk.startOffset,
            endOffset: cwm.chunk.endOffset,
          },
        };
      });

      // 5. Upsert to Vector Store
      await this.vectorStore.upsert(vectorDocs);

      // 6. Enqueue concept extraction job
      await this.jobProducer.enqueueConceptExtractionJob(documentId);

      this.logger.info(
        `Successfully completed embedding for document: ${documentId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process embedding job for document ${documentId}: ${errorMessage}`,
      );
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.FAILED,
      );
      throw error;
    }
  }

  private async completeProcessing(documentId: string): Promise<void> {
    await this.documentRepository.updateStatus(
      documentId,
      INGESTION_STATUS.READY,
    );
  }
}
