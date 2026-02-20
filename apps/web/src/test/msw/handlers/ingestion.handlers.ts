import { http, HttpResponse } from "msw";
import {
  IngestUrlRequestSchema,
  IngestTextRequestSchema,
  IngestPdfRequestSchema,
  IngestYoutubeRequestSchema,
} from "@/features/ingestion/schemas/ingestion.schemas";

export const handlers = [
  http.post("*/ingest/url", async ({ request }) => {
    IngestUrlRequestSchema.parse(await request.json());
    return HttpResponse.json({
      documentId: "doc-1",
      status: "INGESTED",
      message: "Success",
    });
  }),
  http.post("*/ingest/text", async ({ request }) => {
    IngestTextRequestSchema.parse(await request.json());
    return HttpResponse.json({
      documentId: "doc-2",
      status: "INGESTED",
      message: "Success",
    });
  }),
  http.post("*/ingest/pdf", async ({ request }) => {
    IngestPdfRequestSchema.parse(await request.json());
    return HttpResponse.json({
      documentId: "doc-3",
      status: "INGESTED",
      message: "Success",
    });
  }),
  http.post("*/ingest/youtube", async ({ request }) => {
    IngestYoutubeRequestSchema.parse(await request.json());
    return HttpResponse.json({
      documentId: "doc-4",
      status: "INGESTED",
      message: "Success",
    });
  }),
  http.post("*/ingest/retry/:id", ({ params }) => {
    return HttpResponse.json({
      documentId: params.id as string,
      status: "INGESTED",
      message: "Retried",
    });
  }),
  http.get("*/knowledge/documents/:id/status", () => {
    return HttpResponse.json({ status: "READY" });
  }),
];
