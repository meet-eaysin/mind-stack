import type { SearchResultEntity } from './query-repository.interface.js';

const IMPORTANCE_WEIGHT = 0.2;
const TAG_MATCH_WEIGHT = 0.15;
const RECENCY_WEIGHT = 0.1;
const INTERACTION_WEIGHT = 0.05;
const VECTOR_WEIGHT = 0.5;
const RECENCY_HALF_LIFE_DAYS = 30;

export function rankResults(
  results: Array<{
    chunkId: string;
    documentId: string;
    content: string;
    documentTitle: string;
    vectorScore: number;
    importanceScore: number | null;
    tags: string[];
    createdAt: Date;
    hasNote: boolean;
    reviewCount: number;
    queryTags?: string[] | undefined;
  }>,
): SearchResultEntity[] {
  const now = Date.now();

  return results
    .map((r) => {
      const normalizedImportance = (r.importanceScore ?? 3) / 5;

      const matchingTags = r.queryTags
        ? r.tags.filter((t) => r.queryTags?.includes(t)).length
        : 0;
      const tagMatchBoost = r.queryTags?.length
        ? matchingTags / r.queryTags.length
        : 0;

      const ageInDays = (now - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyDecay = Math.exp(
        (-Math.LN2 * ageInDays) / RECENCY_HALF_LIFE_DAYS,
      );

      const interactionBoost =
        (r.hasNote ? 0.5 : 0) + Math.min(r.reviewCount * 0.1, 0.5);

      const finalScore =
        VECTOR_WEIGHT * r.vectorScore +
        IMPORTANCE_WEIGHT * normalizedImportance +
        TAG_MATCH_WEIGHT * tagMatchBoost +
        RECENCY_WEIGHT * recencyDecay +
        INTERACTION_WEIGHT * interactionBoost;

      return {
        chunkId: r.chunkId,
        content: r.content,
        documentTitle: r.documentTitle,
        vectorScore: r.vectorScore,
        importanceScore: r.importanceScore,
        tagMatchBoost,
        recencyDecay,
        finalScore,
        tags: r.tags,
        hasNote: r.hasNote,
        documentId: r.documentId,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
