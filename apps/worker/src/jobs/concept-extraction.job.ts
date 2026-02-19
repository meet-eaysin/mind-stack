import { z } from "zod";
import type { PrismaClient } from "@repo/database";
import type { LLMProvider } from "@repo/llm";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";
import { type RelationType, RELATION_TYPE } from "@repo/shared-types";
import { Job } from "bullmq";

const logger = createLogger("ConceptExtractionJob");

type ExtractedConcept = {
  label: string;
  relations: Array<{
    target: string;
    type: RelationType;
  }>;
};

const ExtractedConceptSchema = z.object({
  label: z.string(),
  relations: z.array(
    z.object({
      target: z.string(),
      type: z.enum([
        RELATION_TYPE.RELATES_TO,
        RELATION_TYPE.IS_PART_OF,
        RELATION_TYPE.DEPENDS_ON,
        RELATION_TYPE.SIMILAR_TO,
        RELATION_TYPE.LEADS_TO,
      ] as const),
    }),
  ),
});

const ExtractedConceptsSchema = z.array(ExtractedConceptSchema);

export async function handleConceptExtractionJob(
  job: Job<{ documentId: string }, void, string>,
  prisma: PrismaClient,
  llmProvider: LLMProvider,
): Promise<void> {
  const { documentId } = job.data;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    logger.error("Document not found", { documentId });
    throw new Error(`Document not found: ${documentId}`);
  }

  // Only run if we are in the correct state (or retrying)
  if (document.status !== "GRAPH_BUILDING" && document.status !== "EMBEDDING") {
    logger.warn("Skipping concept extraction, document in wrong state", {
      documentId,
      status: document.status,
    });
    return;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "GRAPH_BUILDING" },
  });

  try {
    const chunks = await prisma.chunk.findMany({
      where: { documentId },
    });

    if (chunks.length === 0) {
      logger.warn("No chunks found for document", { documentId });
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "READY" },
      });
      return;
    }

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

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });

    logger.info("Concept extraction completed", {
      documentId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    logger.error("Concept extraction failed", { documentId, error: message });
    throw error;
  }
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
    "You are a knowledge extraction agent.",
    "List the technical concepts from the text.",
    "Format each concept on a new line like this:",
    "Concept: Name",
    "",
    "Do not provide any other text, instructions, or code.",
  ].join("\n");

  const response = await llmProvider.generate({
    prompt: `Text: ${content.substring(0, 500)}\n\nConcepts:`,
    systemPrompt,
    temperature: 0.1,
  });

  logger.info("Raw LLM extraction response", {
    text: response.text,
  });

  try {
    const rawBody = response.text.trim();

    // 1. Try to find JSON array
    const startIdx = rawBody.indexOf("[");
    const endIdx = rawBody.lastIndexOf("]");

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonCandidate = rawBody.substring(startIdx, endIdx + 1);
      try {
        const parsed: unknown = JSON.parse(jsonCandidate);
        return ExtractedConceptsSchema.parse(parsed);
      } catch (e) {
        logger.warn("JSON candidate failed to parse, trying fallback", {
          error: e,
        });
      }
    }

    // 2. Fallback: Simple concept extraction from text if JSON fails
    // Look for things like "Concept: Name" or just a list of nouns if the model was chatty
    const lines = rawBody.split("\n");
    const extracted: ExtractedConcept[] = [];

    for (const line of lines) {
      // Remove leading bullet points/numbers
      const cleanLine = line.replace(/^[*•\d.-]+\s*/, "").trim();
      if (cleanLine.length === 0) continue;

      // If line is short enough, use it entirely
      if (
        cleanLine.length > 2 &&
        cleanLine.length < 50 &&
        !cleanLine.includes("{")
      ) {
        extracted.push({ label: cleanLine, relations: [] });
        continue;
      }

      // If line contains a colon (like "Concept: Description"), take the first part
      const colonIdx = cleanLine.indexOf(":");
      if (colonIdx > 2 && colonIdx < 50) {
        const label = cleanLine.substring(0, colonIdx).trim();
        extracted.push({ label, relations: [] });
      }
    }

    return extracted.slice(0, 10); // Limit to 10 concepts per chunk
  } catch (error) {
    logger.warn("All extraction attempts failed", {
      error: error instanceof Error ? error.message : String(error),
      rawResponse: response.text,
    });
    return [];
  }
}
