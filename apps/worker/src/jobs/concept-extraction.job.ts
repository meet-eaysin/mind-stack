import type { PrismaClient } from "@repo/database";
import type { LLMProvider } from "@repo/llm";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";
import type { RelationType } from "@repo/shared-types";

const logger = createLogger("ConceptExtractionJob");

interface ExtractedConcept {
  label: string;
  relations: Array<{
    target: string;
    type: RelationType;
  }>;
}

export async function handleConceptExtractionJob(
  data: { documentId: string },
  prisma: PrismaClient,
  llmProvider: LLMProvider,
): Promise<void> {
  const chunks = await prisma.chunk.findMany({
    where: { documentId: data.documentId },
  });

  for (const chunk of chunks) {
    const concepts = await extractConcepts(chunk.content, llmProvider);

    for (const concept of concepts) {
      const source = await findOrCreateConcept(prisma, concept.label);

      for (const relation of concept.relations) {
        const target = await findOrCreateConcept(prisma, relation.target);

        await prisma.conceptRelation.upsert({
          where: {
            fromConceptId_toConceptId_relationType: {
              fromConceptId: source.id,
              toConceptId: target.id,
              relationType: relation.type,
            },
          },
          create: {
            id: randomUUID(),
            fromConceptId: source.id,
            toConceptId: target.id,
            relationType: relation.type,
          },
          update: {},
        });
      }
    }
  }

  logger.info("Concept extraction completed", {
    documentId: data.documentId,
    chunkCount: chunks.length,
  });
}

async function findOrCreateConcept(
  prisma: PrismaClient,
  label: string,
): Promise<{ id: string; label: string }> {
  const existing = await prisma.concept.findUnique({
    where: { label },
  });
  if (existing) return existing;

  return prisma.concept.create({
    data: { id: randomUUID(), label },
  });
}

async function extractConcepts(
  content: string,
  llmProvider: LLMProvider,
): Promise<ExtractedConcept[]> {
  const systemPrompt = [
    "Extract key technical concepts and their relationships from the text.",
    "Return a JSON array of objects with:",
    '  - "label": concept name (string)',
    '  - "relations": array of { "target": string, "type": "RELATES_TO" | "IS_PART_OF" | "DEPENDS_ON" | "SIMILAR_TO" | "LEADS_TO" }',
    "Return ONLY valid JSON, no markdown or explanation.",
  ].join("\n");

  const response = await llmProvider.generate({
    prompt: content.substring(0, 2000),
    systemPrompt,
    temperature: 0.1,
  });

  try {
    const parsed = JSON.parse(response.text) as ExtractedConcept[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    logger.warn("Failed to parse concept extraction response");
    return [];
  }
}
