import { http, HttpResponse } from "msw";
import {
  BuildGraphRequestSchema,
  CreateRelationRequestSchema,
  NeighborhoodRequestSchema,
} from "@/features/graph/schemas/graph.schemas";

export const handlers = [
  http.get("*/graph", () => {
    return HttpResponse.json({
      nodes: [
        { id: "doc-1", label: "Document A", chunkCount: 5 },
        { id: "root", label: "user brain", chunkCount: 0 },
      ],
      edges: [{ fromId: "doc-1", toId: "root", relationType: "IS_PART_OF" }],
    });
  }),
  http.post("*/graph/build", async ({ request }) => {
    BuildGraphRequestSchema.parse(await request.json());
    return HttpResponse.json({ success: true });
  }),
  http.post("*/graph/neighborhood", async ({ request }) => {
    NeighborhoodRequestSchema.parse(await request.json());
    return HttpResponse.json({
      nodes: [
        { id: "doc-1", label: "Document A", chunkCount: 5 },
        { id: "root", label: "user brain", chunkCount: 0 },
      ],
      edges: [],
    });
  }),
  http.post("*/graph/relations", async ({ request }) => {
    CreateRelationRequestSchema.parse(await request.json());
    return HttpResponse.json({ slug: "ok" });
  }),
  http.delete("*/graph/relations/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
