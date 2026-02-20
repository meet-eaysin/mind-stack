import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DocumentList, DocumentDetail } from "../components";
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";

describe("Documents Behavior", () => {
  it("should render document list and allow selection", async () => {
    const onSelect = vi.fn();
    render(<DocumentList onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-list")).toBeInTheDocument();
    });

    expect(screen.getByText("Test PDF Document")).toBeInTheDocument();
    expect(screen.getByText("Test URL Document")).toBeInTheDocument();

    const docItem = screen.getByTestId("document-item-doc-1");
    fireEvent.click(docItem);
    expect(onSelect).toHaveBeenCalledWith("doc-1");
  });

  it("should render document detail and manage chunks", async () => {
    const onBack = vi.fn();
    render(<DocumentDetail id="doc-1" onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-detail")).toBeInTheDocument();
    });

    expect(screen.getByText("Test PDF Document")).toBeInTheDocument();
    expect(screen.getByTestId("chunk-list")).toBeInTheDocument();
    expect(
      screen.getByText("This is a test chunk content."),
    ).toBeInTheDocument();

    const addTagInput = screen.getByTestId("add-tag-input");
    fireEvent.change(addTagInput, { target: { value: "new-tag" } });
    fireEvent.submit(addTagInput.closest("form")!);

    await waitFor(() => {
      expect(screen.getByTestId("tag-new-tag")).toBeInTheDocument();
    });

    const addNoteInput = screen.getByTestId("add-note-input");
    fireEvent.change(addNoteInput, { target: { value: "test note" } });
    const addNoteBtn = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addNoteBtn);

    await waitFor(() => {
      expect(screen.getByTestId("chunk-note")).toHaveTextContent("test note");
    });

    const importanceBtn = screen.getByTestId("importance-btn-5");
    fireEvent.click(importanceBtn);

    await waitFor(() => {
      expect(importanceBtn).toHaveClass("bg-primary");
    });

    const backBtn = screen.getByTestId("back-button");
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it("should handles API error in document list", async () => {
    server.use(
      http.get("*/api/knowledge/documents", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<DocumentList onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("document-list-error")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/an unexpected error occurred/i),
    ).toBeInTheDocument();
  });
});
