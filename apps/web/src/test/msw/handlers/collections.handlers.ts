import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/collections", () => {
    return HttpResponse.json([
      {
        id: "col-1",
        name: "Systems Basics",
        description: "Foundational systems documents",
        itemCount: 1,
        progress: 40,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
  }),
  http.get("*/collections/:id", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json({
      id,
      name: "Systems Basics",
      description: "Foundational systems documents",
      goal: "Understand core distributed systems topics",
      items: [
        {
          id: "item-1",
          documentId: "doc-1",
          documentTitle: "Raft Overview",
          learningStatus: "IN_PROGRESS",
          order: 0,
          prerequisiteId: null,
        },
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  }),
  http.post("*/collections", async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      goal?: string;
    };
    return HttpResponse.json({
      id: "col-new",
      name: body.name ?? "New Collection",
      description: body.description ?? null,
      goal: body.goal ?? null,
      items: [],
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
  }),
  http.put("*/collections/:id", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json({
      id,
      name: "Systems Basics Updated",
      description: "Updated",
      goal: null,
      items: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
    });
  }),
  http.delete("*/collections/:id", () => {
    return HttpResponse.json({ success: true });
  }),
  http.post("*/collections/:id/items", () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete("*/collections/:id/items/:documentId", () => {
    return HttpResponse.json({ success: true });
  }),
  http.post("*/collections/:id/reorder", () => {
    return HttpResponse.json({ success: true });
  }),
];
