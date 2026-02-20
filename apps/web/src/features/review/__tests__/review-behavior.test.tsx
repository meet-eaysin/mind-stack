import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { render } from "@/test/test-utils";
import ReviewPage from "@/app/review/page";
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";

describe("Review Behavior", () => {
  it("should render review items and allow feedback", async () => {
    render(<ReviewPage />);

    // Wait for content
    await waitFor(() => {
      expect(screen.getByTestId("review-card-chunk-1")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Document")).toBeInTheDocument();
    expect(screen.getByText("Review chunk content 1")).toBeInTheDocument();

    // Show summary
    const toggleSummary = screen.getByTestId("toggle-summary-btn");
    fireEvent.click(toggleSummary);
    expect(screen.getByTestId("review-summary")).toBeInTheDocument();
    expect(screen.getByText("Summary 1")).toBeInTheDocument();

    // Rate recall
    const recallBtn = screen.getByTestId("recall-btn-5");
    fireEvent.click(recallBtn);
    // Success state is implicit since it's a mutation, but normally we'd check for a toast or UI change

    // Adjust importance
    const importanceBtn = screen.getByTestId("importance-btn-4");
    fireEvent.click(importanceBtn);

    // Navigate to next
    const nextBtn = screen.getByTestId("next-btn");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId("review-card-chunk-2")).toBeInTheDocument();
    });
    expect(screen.getByText("Review chunk content 2")).toBeInTheDocument();
  });

  it("should show empty state when no items to review", async () => {
    server.use(
      http.get("*/api/review/daily", () => {
        return HttpResponse.json({ date: "2024-01-01", items: [] });
      }),
    );

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-empty")).toBeInTheDocument();
    });
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });
});
