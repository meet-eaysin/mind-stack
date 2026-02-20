import { http, HttpResponse } from "msw";
import {
  BuildGraphRequestSchema,
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
];
