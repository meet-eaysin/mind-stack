import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { render } from "@/test/test-utils";
import SearchPage from "@/app/search/page"; // Testing the page since it holds search logic
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";

describe("Search Behavior", () => {
  it("should perform semantic search and display results", async () => {
    render(<SearchPage />);

    const input = screen.getByTestId("search-input");
    const submit = screen.getByTestId("search-submit");

    fireEvent.change(input, { target: { value: "test query" } });
    fireEvent.click(submit);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByTestId("search-results")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Documents")).toBeInTheDocument();
    expect(screen.getByText("95% match")).toBeInTheDocument();
  });

  it("should perform AI question answering", async () => {
    render(<SearchPage />);

    // Switch to Ask AI mode
    const askModeBtn = screen.getByRole("button", { name: /ask ai/i });
    fireEvent.click(askModeBtn);

    const input = screen.getByTestId("search-input");
    const submit = screen.getByTestId("search-submit");

    fireEvent.change(input, { target: { value: "what is test?" } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("ask-result")).toBeInTheDocument();
    });

    expect(screen.getByText("This is a mock AI answer.")).toBeInTheDocument();
    expect(screen.getByText("Citations")).toBeInTheDocument();
    expect(
      screen.queryByTestId("weak-context-warning"),
    ).not.toBeInTheDocument();
  });

  it("should show weak context warning when backend marks weak context", async () => {
    server.use(
      http.post("*/query/ask", () => {
        return HttpResponse.json({
          answer: "Partial answer.",
          weakContext: true,
          citations: [],
        });
      }),
    );

    render(<SearchPage />);

    const askModeBtn = screen.getByRole("button", { name: /ask ai/i });
    fireEvent.click(askModeBtn);

    const input = screen.getByTestId("search-input");
    const submit = screen.getByTestId("search-submit");

    fireEvent.change(input, { target: { value: "hard question" } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("ask-result")).toBeInTheDocument();
    });

    expect(screen.getByTestId("weak-context-warning")).toBeInTheDocument();
  });

  it("should handles search API error", async () => {
    server.use(
      http.post("*/query/search", () => {
        return new HttpResponse(null, { status: 400 });
      }),
    );

    render(<SearchPage />);

    const input = screen.getByTestId("search-input");
    const submit = screen.getByTestId("search-submit");

    fireEvent.change(input, { target: { value: "error query" } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("search-error")).toBeInTheDocument();
    });
  });
});
