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

    // Create a central concept for the document to guarantee connectivity
    const docConceptLabel = normalizeLabel(document.title);
    let docSource;
    if (docConceptLabel) {
      docSource = await findOrCreateConcept(prisma, docConceptLabel);
    }

    for (const chunk of chunks) {
      const concepts = await extractConcepts(chunk.content, llmProvider);

      for (const concept of concepts) {
        const normalizedLabel = normalizeLabel(concept.label);
        if (!normalizedLabel) continue;

        const source = await findOrCreateConcept(prisma, normalizedLabel);

        await prisma.conceptChunk.upsert({
          where: {
            chunkId_conceptId: {
              chunkId: chunk.id,
              conceptId: source.id,
            },
          },
          create: {
            chunkId: chunk.id,
            conceptId: source.id,
          },
          update: {},
        });

        // Always link to document concept to ensure the graph is connected
        if (docSource && docSource.id !== source.id) {
          await prisma.conceptRelation.upsert({
            where: {
              fromConceptId_toConceptId_relationType: {
                fromConceptId: source.id,
                toConceptId: docSource.id,
                relationType: RELATION_TYPE.IS_PART_OF,
              },
            },
            create: {
              id: randomUUID(),
              fromConceptId: source.id,
              toConceptId: docSource.id,
              relationType: RELATION_TYPE.IS_PART_OF,
            },
            update: {},
          });
        }

        for (const relation of concept.relations) {
          const normalizedTarget = normalizeLabel(relation.target);
          if (!normalizedTarget || normalizedTarget === normalizedLabel)
            continue;

          const target = await findOrCreateConcept(prisma, normalizedTarget);

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

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/^[-*•\s]+/, "") // Remove leading bullet points
    .replace(/[.,;:!?]+$/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

async function extractConcepts(
  content: string,
  llmProvider: LLMProvider,
): Promise<ExtractedConcept[]> {
  try {
    const response = await llmProvider.generate({
      prompt: `Chunk: "${content.substring(0, 4000)}"\n\nExtract concepts and relations:`,
      systemPrompt: [
        "Extract core technical concepts and their semantic relations from the text.",
        "Output ONLY plain text in the exact format shown below. Do not use markdown, JSON, or any introductory text.",
        "",
        "Example output:",
        "Concept: React",
        "Target: JavaScript | DEPENDS_ON",
        "Target: UI | RELATES_TO",
        "Concept: Next.js",
        "Target: React | DEPENDS_ON",
        "",
        "Valid relation types: RELATES_TO, IS_PART_OF, DEPENDS_ON, SIMILAR_TO, LEADS_TO",
        "Every Concept MUST start with 'Concept: '.",
        "Every relation MUST start with 'Target: ' and use the '|' separator.",
      ].join("\n"),
      temperature: 0.1,
    });

    const rawBody = response.text.trim();
    const lines = rawBody
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let extracted: ExtractedConcept[] = [];
    let currentConcept: ExtractedConcept | null = null;

    // Pass 1: Strict parsing
    for (const line of lines) {
      if (line.toLowerCase().startsWith("concept:")) {
        const label = line.substring(8).trim();
        if (label.length > 1) {
          currentConcept = { label, relations: [] };
          extracted.push(currentConcept);
        }
      } else if (line.toLowerCase().startsWith("target:") && currentConcept) {
        const parts = line.substring(7).split("|");
        if (parts.length >= 2) {
          const rawTarget = parts[0];
          const rawType = parts[1];
          if (rawTarget && rawType) {
            const target = rawTarget.trim();
            let typeStr = rawType.trim().toUpperCase();

            const validTypes = [
              "RELATES_TO",
              "IS_PART_OF",
              "DEPENDS_ON",
              "SIMILAR_TO",
              "LEADS_TO",
            ];
            if (!validTypes.includes(typeStr)) {
              typeStr = "RELATES_TO";
            }

            if (target.length > 1) {
              currentConcept.relations.push({
                target,
                type: typeStr as RelationType,
              });
            }
          }
        }
      }
    }

    // Pass 2: Ultra-permissive fallback for tiny models if Pass 1 found nothing
    if (extracted.length === 0) {
      for (const line of lines) {
        const cleanLine = line.replace(/^[*•\d.-]+\s*/, "").trim();
        if (
          cleanLine.length > 2 &&
          cleanLine.length < 50 &&
          !cleanLine.includes("{")
        ) {
          // If line contains a colon, just take the first part
          const colonIdx = cleanLine.indexOf(":");
          const label =
            colonIdx > 2 ? cleanLine.substring(0, colonIdx).trim() : cleanLine;
          if (label.length > 2) {
            extracted.push({ label, relations: [] });
          }
        }
      }
    }

    // Remove duplicates
    const seen = new Set<string>();
    extracted = extracted.filter((c) => {
      if (seen.has(c.label.toLowerCase())) return false;
      seen.add(c.label.toLowerCase());
      return true;
    });

    // Aggressive Fallback: Ensure every concept is connected to the graph
    if (extracted.length > 1) {
      const root = extracted[0];
      if (root) {
        for (let i = 1; i < extracted.length; i++) {
          const child = extracted[i];
          if (child && child.relations.length === 0) {
            child.relations.push({ target: root.label, type: "RELATES_TO" });
          }
        }
      }
    }

    return extracted.slice(0, 15);
  } catch (error) {
    logger.error("GRAPH_EXTRACT: Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
