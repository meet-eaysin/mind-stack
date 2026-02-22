import { Controller, Get, Post } from '@nestjs/common';
import { GetQueueMetricsUseCase } from '../application/get-queue-metrics.use-case.js';
import { CleanupConceptsUseCase } from '../application/cleanup-concepts.use-case.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  type QueueMetricsResponse,
  type CleanupResponse,
  type MissingEmbeddingsResponse,
  type OrphansResponse,
  type FailedDocumentsResponse,
} from '@repo/shared-types';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly getQueueMetrics: GetQueueMetricsUseCase,
    private readonly cleanupConcepts: CleanupConceptsUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get('jobs')
  async getJobs(): Promise<QueueMetricsResponse> {
    return this.getQueueMetrics.execute();
  }

  @Post('cleanup')
  async runCleanup(): Promise<CleanupResponse> {
    return this.cleanupConcepts.execute();
  }

  @Get('health/missing-embeddings')
  async getMissingEmbeddings(): Promise<MissingEmbeddingsResponse> {
    // Check for chunks with empty embeddings
    const chunksWithoutEmbeddings = await this.prisma.$queryRaw<
      Array<{ id: string; documentId: string }>
    >`
      SELECT id, "document_id" as "documentId" FROM chunks WHERE embedding IS NULL
    `;

    return { chunksWithoutEmbeddings };
  }

  @Get('health/orphans')
  async getOrphans(): Promise<OrphansResponse> {
    // Chunks without documents (unlikely with FK constraints but good to check)
    // In current schema, documentId is non-nullable, so checking for 'null'
    // would requires casting to invalid type or raw query.
    // If it's truly non-nullable, orphanChunks will be empty.
    const orphanChunks: Array<{ id: string; documentId: string }> = [];

    // Concepts without any relations
    const orphanConcepts = await this.prisma.concept.findMany({
      where: {
        AND: [{ fromRelations: { none: {} } }, { toRelations: { none: {} } }],
      },
      select: {
        id: true,
        label: true,
      },
    });

    return {
      orphanChunks,
      orphanConcepts,
    };
  }

  @Get('health/failed-documents')
  async getFailedDocuments(): Promise<FailedDocumentsResponse> {
    const failedDocuments = await this.prisma.document.findMany({
      where: {
        status: 'FAILED',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return {
      failedDocuments: failedDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }
}
