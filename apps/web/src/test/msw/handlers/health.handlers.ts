import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/admin/health/missing-embeddings", () => {
    return HttpResponse.json({
      chunksWithoutEmbeddings: [],
    });
  }),
  http.get("*/admin/health/orphans", () => {
    return HttpResponse.json({
      orphanChunks: [],
      orphanConcepts: [],
      orphanEmbeddings: [],
    });
  }),
  http.get("*/admin/health/failed-documents", () => {
    return HttpResponse.json({
      failedDocuments: [],
    });
  }),
  http.get("*/admin/jobs", () => {
    return HttpResponse.json({
      waiting: 0,
      active: 0,
      completed: 3,
      failed: 0,
    });
  }),
];
