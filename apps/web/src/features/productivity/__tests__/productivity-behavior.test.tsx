import { describe, it, expect } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { render } from "@/test/test-utils";
import { server } from "@/test/msw/server";
import ProductivityPage from "@/app/(app)/app/productivity/page";
import { z } from "zod";

describe("Productivity Behavior", () => {
  it("renders mastery + goals and refetches after creating goal", async () => {
    let listCalls = 0;
    const goals: Array<{
      id: string;
      name: string;
      deadline: string | null;
      progress: number;
      itemCount: number;
      createdAt: string;
      updatedAt: string;
    }> = [
      {
        id: "goal-1",
        name: "Master TypeScript",
        deadline: "2026-12-01T00:00:00.000Z",
        progress: 35,
        itemCount: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];

    server.use(
      http.get("*/analysis/mastery", () =>
        HttpResponse.json({
          coverage: { totalConcepts: 10, reviewedConcepts: 5, percent: 50 },
          levels: { mastered: 2, consolidating: 2, learning: 3, unseen: 3 },
          weakAreas: [],
          learningStatusDistribution: {},
        }),
      ),
      http.get("*/learning-goals", () => {
        listCalls += 1;
        return HttpResponse.json(goals);
      }),
      http.post("*/learning-goals", async ({ request }) => {
        const bodySchema = z.object({
          name: z.string().optional(),
          deadline: z.string().optional(),
        });
        const body = bodySchema.parse(await request.json());
        goals.push({
          id: "goal-2",
          name: body.name ?? "New Goal",
          deadline: body.deadline ?? "2026-01-03T00:00:00.000Z",
          progress: 0,
          itemCount: 0,
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        });
        return HttpResponse.json({
          id: "goal-2",
          name: body.name ?? "New Goal",
          deadline: body.deadline ?? "2026-01-03T00:00:00.000Z",
          progress: 0,
          items: [],
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        });
      }),
    );

    render(<ProductivityPage />);

    await waitFor(() => {
      expect(screen.getByText("Master TypeScript")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /new goal/i }));
    fireEvent.change(screen.getByLabelText(/goal name/i), {
      target: { value: "Master NestJS" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create goal$/i }));

    await waitFor(() => {
      expect(screen.getByText("Master NestJS")).toBeInTheDocument();
    });

    expect(listCalls).toBeGreaterThan(1);
  }, 15000);

  it("renders loading and empty states", async () => {
    server.use(
      http.get("*/analysis/mastery", async () => {
        await delay(120);
        return HttpResponse.json({
          coverage: { totalConcepts: 0, reviewedConcepts: 0, percent: 0 },
          levels: { mastered: 0, consolidating: 0, learning: 0, unseen: 0 },
          weakAreas: [],
          learningStatusDistribution: {},
        });
      }),
      http.get("*/learning-goals", () => HttpResponse.json([])),
    );

    render(<ProductivityPage />);
    expect(screen.getByTestId("mastery-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No learning goals yet")).toBeInTheDocument();
    });
  });

  it("shows backend and network errors", async () => {
    server.use(
      http.get("*/analysis/mastery", () =>
        HttpResponse.json(
          { message: "Invalid mastery request" },
          { status: 400 },
        ),
      ),
    );
    render(<ProductivityPage />);
    await waitFor(() => {
      expect(screen.getByText("Invalid mastery request")).toBeInTheDocument();
    });

    server.use(http.get("*/learning-goals", () => HttpResponse.error()));
    render(<ProductivityPage />);
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });
});
