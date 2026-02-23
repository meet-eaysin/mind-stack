import { http, HttpResponse } from "msw";
import {
  BuildGraphRequestSchema,
  CreateRelationRequestSchema,
  NeighborhoodRequestSchema,
} from "@/features/graph/schemas/graph.schemas";

export const handlers = [
  http.get("*/graph", () => {
    return HttpResponse.json({
      nodes: [{ id: "concept-1", label: "Concept A", chunkCount: 5 }],
      edges: [
        { fromId: "concept-1", toId: "concept-2", relationType: "RELATES_TO" },
      ],
    });
  }),
  http.post("*/graph/build", async ({ request }) => {
    BuildGraphRequestSchema.parse(await request.json());
    return HttpResponse.json({ success: true });
  }),
  http.post("*/graph/neighborhood", async ({ request }) => {
    NeighborhoodRequestSchema.parse(await request.json());
    return HttpResponse.json({
      nodes: [{ id: "concept-1", label: "Concept A", chunkCount: 5 }],
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
