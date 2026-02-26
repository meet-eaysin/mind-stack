import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { LlmConfigRepository } from '../domain/llm-config.repository.interface.js';
import type { LlmConfigEntity } from '../domain/llm-config.entity.js';
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from '@repo/shared-types';

type LlmConfigRow = {
  id: string;
  userId: string;
  provider: string;
  model: string;
  baseUrl: string | null;
  encryptedApiKey: string | null;
  enabledCapabilities: string[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaLlmConfigRepository implements LlmConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: LlmConfigRow): LlmConfigEntity {
    return {
      id: row.id,
      userId: row.userId,
      provider: toModelProvider(row.provider),
      model: row.model,
      baseUrl: row.baseUrl,
      encryptedApiKey: row.encryptedApiKey,
      enabledCapabilities: row.enabledCapabilities.map(toModelCapability),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<LlmConfigEntity | null> {
    const rows = await this.prisma.$queryRaw<LlmConfigRow[]>`
      SELECT
        "id",
        "user_id" AS "userId",
        "provider",
        "model",
        "base_url" AS "baseUrl",
        "encrypted_api_key" AS "encryptedApiKey",
        "enabled_capabilities" AS "enabledCapabilities",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
      FROM "user_llm_configs"
      WHERE "user_id" = ${userId}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return this.mapRow(row);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.userLlmConfig.deleteMany({ where: { userId } });
  }

  async upsertByUserId(
    userId: string,
    data: {
      provider: ModelProvider;
      model: string;
      baseUrl: string | null;
      encryptedApiKey: string | null;
      enabledCapabilities: ModelCapability[];
    },
  ): Promise<LlmConfigEntity> {
    const enabledCapabilitiesSql =
      data.enabledCapabilities.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(data.enabledCapabilities)}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`;

    const rows = await this.prisma.$queryRaw<LlmConfigRow[]>`
      INSERT INTO "user_llm_configs" (
        "id",
        "user_id",
        "provider",
        "model",
        "base_url",
        "encrypted_api_key",
        "enabled_capabilities",
        "updated_at"
      )
      VALUES (
        ${randomUUID()},
        ${userId},
        ${data.provider},
        ${data.model},
        ${data.baseUrl},
        ${data.encryptedApiKey},
        ${enabledCapabilitiesSql},
        NOW()
      )
      ON CONFLICT ("user_id")
      DO UPDATE SET
        "provider" = EXCLUDED."provider",
        "model" = EXCLUDED."model",
        "base_url" = EXCLUDED."base_url",
        "encrypted_api_key" = EXCLUDED."encrypted_api_key",
        "enabled_capabilities" = EXCLUDED."enabled_capabilities",
        "updated_at" = NOW()
      RETURNING
        "id",
        "user_id" AS "userId",
        "provider",
        "model",
        "base_url" AS "baseUrl",
        "encrypted_api_key" AS "encryptedApiKey",
        "enabled_capabilities" AS "enabledCapabilities",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
    `;
    const row = rows[0];
    if (!row) {
      throw new Error('Failed to upsert user llm configuration');
    }
    return this.mapRow(row);
  }
}

const toModelProvider = (value: string): ModelProvider => {
  if (value === MODEL_PROVIDER.OLLAMA) {
    return MODEL_PROVIDER.OLLAMA;
  }
  if (value === MODEL_PROVIDER.OPENAI) {
    return MODEL_PROVIDER.OPENAI;
  }
  if (value === MODEL_PROVIDER.OPENROUTER) {
    return MODEL_PROVIDER.OPENROUTER;
  }
  if (value === MODEL_PROVIDER.GEMINI) {
    return MODEL_PROVIDER.GEMINI;
  }
  throw new Error(`Invalid provider in database: ${value}`);
};

const toModelCapability = (value: string): ModelCapability => {
  if (value === MODEL_CAPABILITY.CHAT) {
    return MODEL_CAPABILITY.CHAT;
  }
  if (value === MODEL_CAPABILITY.EMBEDDING) {
    return MODEL_CAPABILITY.EMBEDDING;
  }
  throw new Error(`Invalid model capability in database: ${value}`);
};
