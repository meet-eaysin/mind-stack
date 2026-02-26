import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { render } from "@/test/test-utils";
import SearchPage from "@/app/(app)/app/search/page"; // Testing the page since it holds search logic
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";
import { FilteredSearchRequestSchema } from "@/features/search/schemas/search.schemas";

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

  it("does not submit when query is empty", async () => {
    let requestCount = 0;
    server.use(
      http.post("*/query/search", () => {
        requestCount += 1;
        return HttpResponse.json({ documents: [] });
      }),
    );

    render(<SearchPage />);
    fireEvent.click(screen.getByTestId("search-submit"));

    expect(requestCount).toBe(0);
  });

  it("uses filtered endpoint when advanced filters are set", async () => {
    let calledFiltered = false;
    server.use(
      http.post("*/query/search/filtered", async ({ request }) => {
        calledFiltered = true;
        const body = FilteredSearchRequestSchema.parse(await request.json());
        expect(body.query).toBe("typescript");
        expect(body.tags).toEqual(["backend", "rfc"]);
        return HttpResponse.json({
          documents: [
            {
              documentId: "d2",
              title: "Filtered Result",
              score: 0.88,
              tags: ["backend", "rfc"],
              hasNote: false,
            },
          ],
        });
      }),
    );

    render(<SearchPage />);
    fireEvent.click(screen.getByTestId("toggle-advanced-filters"));
    fireEvent.change(screen.getByTestId("filter-tags-input"), {
      target: { value: "backend, rfc" },
    });
    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "typescript" },
    });
    fireEvent.click(screen.getByTestId("search-submit"));

    await waitFor(() => {
      expect(screen.getByText("Filtered Result")).toBeInTheDocument();
    });
    expect(calledFiltered).toBe(true);
  });

  it("shows empty state when semantic search returns no documents", async () => {
    server.use(
      http.post("*/query/search", () => {
        return HttpResponse.json({ documents: [] });
      }),
    );

    render(<SearchPage />);
    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "nothing" },
    });
    fireEvent.click(screen.getByTestId("search-submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "No matching documents found. Try broader terms or remove filters.",
        ),
      ).toBeInTheDocument();
    });
  });
});
