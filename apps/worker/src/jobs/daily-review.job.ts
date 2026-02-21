import { Prisma, PrismaClient } from "@repo/database";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";

const logger = createLogger("DailyReviewJob");

const DEFAULT_REVIEW_SCORE = 0;

export async function handleDailyReviewJob(
  prisma: PrismaClient,
): Promise<void> {
  const documentsWithoutReview = await prisma.document.findMany({
    where: {
      Review: { none: {} },
    },
    select: { id: true },
  });

  if (documentsWithoutReview.length === 0) {
    logger.info("No new documents need review initialization");
    return;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const doc of documentsWithoutReview) {
      await tx.review.create({
        data: {
          id: randomUUID(),
          documentId: doc.id,
          reviewScore: DEFAULT_REVIEW_SCORE,
        },
      });
    }
  });

  logger.info("Daily review job completed", {
    newReviewEntries: documentsWithoutReview.length,
  });
}
