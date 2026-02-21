import { http, HttpResponse } from "msw";
import {
  SubmitFeedbackRequestSchema,
  UpdateReviewScoreRequestSchema,
} from "@/features/review/schemas/review.schemas";

export const handlers = [
  http.get("*/review/daily", () => {
    return HttpResponse.json({
      date: "2024-01-01",
      items: [
        {
          documentId: "doc-1",
          documentTitle: "Test Document",
          content: "Review content for document 1",
          summary: "Summary 1",
          reason: "Reason 1",
          lastReviewedAt: null,
        },
        {
          documentId: "doc-2",
          documentTitle: "Test Document 2",
          content: "Review content for document 2",
          summary: "Summary 2",
          reason: "Reason 2",
          lastReviewedAt: null,
        },
      ],
    });
  }),
  http.post("*/review/feedback", async ({ request }) => {
    SubmitFeedbackRequestSchema.parse(await request.json());
    return HttpResponse.json({ success: true });
  }),
  http.post("*/review/score", async ({ request }) => {
    UpdateReviewScoreRequestSchema.parse(await request.json());
    return HttpResponse.json({ success: true });
  }),
];
