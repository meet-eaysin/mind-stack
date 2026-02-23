import { http, HttpResponse } from "msw";
import {
  SemanticSearchRequestSchema,
  FilteredSearchRequestSchema,
  AskQuestionRequestSchema,
} from "@/features/search/schemas/search.schemas";

export const handlers = [
  http.post("*/query/search", async ({ request }) => {
    SemanticSearchRequestSchema.parse(await request.json());
    return HttpResponse.json({
      documents: [
        {
          documentId: "d1",
          title: "Test Documents",
          score: 0.95,
          tags: ["tag1"],
          hasNote: false,
        },
      ],
    });
  }),
  http.post("*/query/search/filtered", async ({ request }) => {
    FilteredSearchRequestSchema.parse(await request.json());
    return HttpResponse.json({ documents: [] });
  }),
  http.post("*/query/ask", async ({ request }) => {
    AskQuestionRequestSchema.parse(await request.json());
    return HttpResponse.json({
      answer: "This is a mock AI answer.",
      weakContext: false,
      citations: [
        {
          chunkId: "c1",
          documentId: "d1",
          documentTitle: "Test Documents",
          content: "Citation content",
          score: 0.9,
          tags: [],
          hasNote: false,
        },
      ],
    });
  }),
  http.post("*/query/retrieve", () => {
    return HttpResponse.json({ chunks: [] });
  }),
];
