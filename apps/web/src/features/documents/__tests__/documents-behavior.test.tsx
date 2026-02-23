import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DocumentList, DocumentDetail } from "../components";
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";

describe("Documents Behavior", () => {
  it("should render document list and allow selection", async () => {
    const onSelectAction = vi.fn();
    render(<DocumentList onSelectAction={onSelectAction} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-list")).toBeInTheDocument();
    });

    expect(screen.getByText("Test PDF Document")).toBeInTheDocument();
    expect(screen.getByText("Test URL Document")).toBeInTheDocument();

    const docItem = screen.getByTestId("document-item-doc-1");
    const docBtn = docItem.querySelector("button");
    if (!docBtn) throw new Error("Document button not found");
    fireEvent.click(docBtn);
    expect(onSelectAction).toHaveBeenCalledWith("doc-1");
  });

  it("should render document detail and manage chunks", async () => {
    const onBackAction = vi.fn();
    render(<DocumentDetail id="doc-1" onBackAction={onBackAction} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-detail")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Test PDF Document")[0]).toBeInTheDocument();

    const readerTab = screen.queryByRole("tab", { name: /reader/i });
    if (readerTab) {
      await userEvent.click(readerTab);
    }

    await waitFor(() => {
      expect(screen.getByTestId("chunk-list")).toBeInTheDocument();
    });
    expect(
      screen.getByText("This is a test chunk content."),
    ).toBeInTheDocument();

    // Click Settings to show tag input
    const settingsBtn = screen.getByRole("button", { name: /settings/i });
    fireEvent.click(settingsBtn);

    const addTagInput = screen.getByTestId("add-tag-input");
    fireEvent.change(addTagInput, { target: { value: "new-tag" } });
    const form = addTagInput.closest("form");
    if (!form) throw new Error("Tag form not found");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId("tag-new-tag")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("related-resources-list")).toBeInTheDocument();
    });
    expect(screen.getByText("Related Test Document")).toBeInTheDocument();
    expect(
      screen.getByTestId("related-open-document-doc-2"),
    ).toBeInTheDocument();

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    fireEvent.click(screen.getByTestId("related-open-source-doc-2"));
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();

    expect(screen.getByText(/annotations/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("quick-annotation-type-QUESTION"));
    fireEvent.change(screen.getByTestId("quick-note-input"), {
      target: { value: "What tradeoffs does this approach have?" },
    });
    fireEvent.click(screen.getByTestId("quick-note-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("note-type-QUESTION")).toBeInTheDocument();
    });

    const importanceBtn = screen.getByTestId("importance-btn-5");
    fireEvent.click(importanceBtn);

    await waitFor(() => {
      expect(importanceBtn).toHaveClass("bg-primary");
    });

    const backBtn = screen.getByTestId("back-button");
    fireEvent.click(backBtn);
    expect(onBackAction).toHaveBeenCalled();
  }, 10000);

  it("should show empty and error states for related resources", async () => {
    server.use(
      http.get("*/knowledge/documents/:id/related", () => {
        return HttpResponse.json([]);
      }),
    );

    render(<DocumentDetail id="doc-1" onBackAction={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("related-resources-empty")).toBeInTheDocument();
    });

    server.use(
      http.get("*/knowledge/documents/:id/related", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    fireEvent.click(screen.getByTestId("related-refresh"));

    await waitFor(() => {
      expect(screen.getByTestId("related-resources-error")).toBeInTheDocument();
    });
  });

  it("should handles API error in document list", async () => {
    server.use(
      http.get("*/knowledge/documents", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<DocumentList onSelectAction={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-list-error")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/an unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it("shows processing error when ingestion failed", async () => {
    server.use(
      http.get("*/knowledge/documents/:id/details", () =>
        HttpResponse.json({
          id: "doc-failed",
          title: "Failed Document",
          sourceType: "URL",
          sourceUrl: "https://example.com",
          rawContent: "content",
          chunks: [],
          tags: [],
          notes: [],
          importanceScore: null,
          status: "FAILED",
          processingError: "Embedding model not available",
          learningStatus: "UPCOMING",
          type: "ARTICLE",
          author: null,
          publisher: null,
          publishedAt: null,
          language: "en",
          addedByUserAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }),
      ),
    );

    render(<DocumentDetail id="doc-failed" onBackAction={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Processing failed")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Embedding model not available"),
    ).toBeInTheDocument();
  });
});
