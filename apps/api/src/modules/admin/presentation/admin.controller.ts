import { Controller, Get, Post, Inject } from '@nestjs/common';
import { GetQueueMetricsUseCase } from '../application/get-queue-metrics.use-case.js';
import { CleanupConceptsUseCase } from '../application/cleanup-concepts.use-case.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { VECTOR_STORE } from '../../../common/tokens.js';
import type { VectorStore } from '@repo/vector-store';
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
    @Inject(VECTOR_STORE) private readonly vectorStore: VectorStore,
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
    // 1. Get all chunk IDs and their document IDs from Prisma
    const allChunks = await this.prisma.chunk.findMany({
      select: {
        id: true,
        documentId: true,
      },
    });

    if (allChunks.length === 0) {
      return { chunksWithoutEmbeddings: [] };
    }

    const allChunkIds = allChunks.map((c: { id: string }) => c.id);

    // 2. Check which of these IDs exist in Chroma
    const existingIdsInChroma = (await this.vectorStore.getByIds(
      allChunkIds,
    )) as string[];
    const existingIdsSet = new Set(existingIdsInChroma);

    // 3. Filter IDs that are in Prisma but NOT in Chroma
    const chunksWithoutEmbeddings = allChunks
      .filter(
        (c: { id: string; documentId: string }) => !existingIdsSet.has(c.id),
      )
      .map((c: { id: string; documentId: string }) => ({
        id: c.id,
        documentId: c.documentId,
      }));

    return { chunksWithoutEmbeddings };
  }

  @Get('health/orphans')
  async getOrphans(): Promise<OrphansResponse> {
    // 1. Chunks without documents (Impossible by DB schema but good for logic consistency)
    const orphanChunks: Array<{ id: string; documentId: string }> = [];

    // 2. Embeddings in Chroma without Chunks in Postgres
    const allChromaIds = (await this.vectorStore.getAllIds()) as string[];
    const allChunks = await this.prisma.chunk.findMany({
      select: { id: true },
    });
    const postgresChunkIds = new Set(
      allChunks.map((c: { id: string }) => c.id),
    );

    const orphanEmbeddings = allChromaIds
      .filter((id: string) => !postgresChunkIds.has(id))
      .map((id: string) => ({ id }));

    // 3. Concepts without any relations
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
      orphanEmbeddings,
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
      failedDocuments: failedDocuments.map(
        (d: { id: string; title: string; createdAt: Date }) => ({
          id: d.id,
          title: d.title,
          createdAt: d.createdAt.toISOString(),
        }),
      ),
    };
  }
}
