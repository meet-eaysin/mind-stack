import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { LlmConfigRepository } from '../domain/llm-config.repository.interface.js';
import type { LlmConfigEntity } from '../domain/llm-config.entity.js';
import { MODEL_PROVIDER, type ModelProvider } from '@repo/shared-types';

@Injectable()
export class PrismaLlmConfigRepository implements LlmConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: {
    id: string;
    userId: string;
    embeddingProvider: string;
    embeddingModel: string;
    generationProvider: string;
    generationModel: string;
    createdAt: Date;
    updatedAt: Date;
  }): LlmConfigEntity {
    const embeddingProvider = toModelProvider(
      row.embeddingProvider,
      'embedding',
    );
    const generationProvider = toModelProvider(
      row.generationProvider,
      'generation',
    );
    return {
      id: row.id,
      userId: row.userId,
      embeddingProvider,
      embeddingModel: row.embeddingModel,
      generationProvider,
      generationModel: row.generationModel,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<LlmConfigEntity | null> {
    const row = await this.prisma.userLlmConfig.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return this.mapRow(row);
  }

  async upsertByUserId(
    userId: string,
    data: {
      embeddingProvider: ModelProvider;
      embeddingModel: string;
      generationProvider: ModelProvider;
      generationModel: string;
    },
  ): Promise<LlmConfigEntity> {
    const row = await this.prisma.userLlmConfig.upsert({
      where: { userId },
      create: {
        userId,
        embeddingProvider: data.embeddingProvider,
        embeddingModel: data.embeddingModel,
        generationProvider: data.generationProvider,
        generationModel: data.generationModel,
      },
      update: {
        embeddingProvider: data.embeddingProvider,
        embeddingModel: data.embeddingModel,
        generationProvider: data.generationProvider,
        generationModel: data.generationModel,
      },
    });
    return this.mapRow(row);
  }
}

const toModelProvider = (
  value: string,
  label: 'embedding' | 'generation',
): ModelProvider => {
  if (value === MODEL_PROVIDER.OLLAMA) {
    return MODEL_PROVIDER.OLLAMA;
  }
  throw new Error(`Invalid ${label} provider in database: ${value}`);
};
