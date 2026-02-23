import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/analysis/mastery", () => {
    return HttpResponse.json({
      coverage: {
        totalConcepts: 10,
        reviewedConcepts: 5,
        percent: 50,
      },
      levels: {
        mastered: 2,
        consolidating: 2,
        learning: 3,
        unseen: 3,
      },
      weakAreas: [
        {
          id: "c-1",
          label: "consensus",
          easeFactor: 1.9,
          interval: 2,
        },
      ],
      learningStatusDistribution: {
        IN_PROGRESS: 2,
        REVIEW: 1,
      },
    });
  }),
  http.get("*/learning-goals", () => {
    return HttpResponse.json([
      {
        id: "goal-1",
        name: "Master TypeScript",
        deadline: "2026-12-01T00:00:00.000Z",
        progress: 35,
        itemCount: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
  }),
  http.post("*/learning-goals", async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      deadline?: string;
    };
    return HttpResponse.json({
      id: "goal-new",
      name: body.name ?? "New Goal",
      deadline: body.deadline ?? null,
      progress: 0,
      items: [],
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
  }),
  http.delete("*/learning-goals/:id", () => {
    return HttpResponse.json({ success: true });
  }),
  http.get("*/learning-goals/:id", ({ params }) => {
    return HttpResponse.json({
      id: String(params.id),
      name: "Goal Detail",
      deadline: null,
      progress: 10,
      items: [],
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
  }),
];
