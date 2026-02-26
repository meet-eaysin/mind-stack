import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { render } from "@/test/test-utils";
import { server } from "@/test/msw/server";
import HealthPage from "@/app/(app)/app/health/page";

describe("Health Behavior", () => {
  it("renders healthy dashboard data", async () => {
    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText("Export Brain Data")).toBeInTheDocument();
    });

    expect(screen.getByText("Missing Embeddings")).toBeInTheDocument();
  });

  it("renders loading and then empty issue state", async () => {
    server.use(
      http.get("*/admin/health/missing-embeddings", async () => {
        await delay(120);
        return HttpResponse.json({ chunksWithoutEmbeddings: [] });
      }),
    );

    render(<HealthPage />);
    expect(screen.getByTestId("health-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("All Systems Healthy")).toBeInTheDocument();
    });
  });

  it("shows backend validation error", async () => {
    server.use(
      http.get("*/admin/health/missing-embeddings", () =>
        HttpResponse.json(
          { message: "Invalid diagnostics request" },
          { status: 400 },
        ),
      ),
    );
    render(<HealthPage />);
    await waitFor(() => {
      expect(
        screen.getByText("Invalid diagnostics request"),
      ).toBeInTheDocument();
    });
  });

  it("shows network error", async () => {
    server.use(http.get("*/admin/jobs", () => HttpResponse.error()));
    render(<HealthPage />);
    await waitFor(() => {
      expect(screen.getByTestId("health-error")).toBeInTheDocument();
    });
  });
});
