import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { INGESTION_QUEUE } from '../ingestion-job.producer.js';
import { PrismaDocumentRepository } from '../prisma-document.repository.js';
import { PrismaChunkRepository } from '../../../knowledge/infrastructure/prisma-chunk.repository.js';
import { BuildGraphUseCase } from '../../../graph/application/build-graph.use-case.js';
import { JOB_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import { createLogger } from '@repo/logger';
import type { IngestionJob } from '../../domain/ingestion-job.types.js';

@Injectable()
@Processor(INGESTION_QUEUE)
export class ConceptExtractionProcessor extends WorkerHost {
  private readonly logger = createLogger('ConceptExtractionProcessor');

  constructor(
    @Inject(PrismaDocumentRepository)
    private readonly documentRepository: PrismaDocumentRepository,
    @Inject(PrismaChunkRepository)
    private readonly chunkRepository: PrismaChunkRepository,
    @Inject(BuildGraphUseCase)
    private readonly buildGraph: BuildGraphUseCase,
  ) {
    super();
  }

  async process(job: IngestionJob): Promise<void> {
    if (job.name !== JOB_TYPE.CONCEPT_EXTRACTION) {
      return;
    }

    const { documentId } = job.data;
    this.logger.info(
      `Processing concept extraction job for document: ${documentId}`,
    );

    try {
      // 1. Update status
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.GRAPH_BUILDING,
      );

      // 2. Fetch chunks
      const chunksWithMeta =
        await this.chunkRepository.findByDocumentId(documentId);

      // 3. Process each chunk for concept extraction
      for (const cwm of chunksWithMeta) {
        this.logger.debug(`Extracting concepts from chunk: ${cwm.chunk.id}`);
        await this.buildGraph.execute({
          chunkId: cwm.chunk.id,
          chunkContent: cwm.chunk.content,
        });
      }

      // 4. Set final status
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.READY,
      );

      this.logger.info(
        `Successfully completed concept extraction and graph building for document: ${documentId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process concept extraction job for document ${documentId}: ${errorMessage}`,
      );
      await this.documentRepository.updateStatus(
        documentId,
        INGESTION_STATUS.FAILED,
      );
      throw error;
    }
  }
}
