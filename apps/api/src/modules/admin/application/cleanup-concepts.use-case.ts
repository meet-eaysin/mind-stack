import { Injectable } from '@nestjs/common';
import { type CleanupResponse } from '@repo/shared-types';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CleanupConceptsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<CleanupResponse> {
    // Find concepts that have 0 related ConceptChunks
    const orphanedConcepts = await this.prisma.concept.findMany({
      where: {
        conceptChunks: {
          none: {},
        },
      },
      select: { id: true },
    });

    const ids = orphanedConcepts.map((c) => c.id);
    if (ids.length === 0) {
      return { deletedCount: 0 };
    }

    // Delete them
    const { count } = await this.prisma.concept.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return { deletedCount: count };
  }
}
