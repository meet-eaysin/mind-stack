import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    const docBtn = docItem.querySelector("button");
    if (!docBtn) throw new Error("Document button not found");
    fireEvent.click(docBtn);
    expect(onSelect).toHaveBeenCalledWith("doc-1");
  });

  it("should render document detail and manage chunks", async () => {
    const onBack = vi.fn();
    render(<DocumentDetail id="doc-1" onBack={onBack} />);

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

    expect(screen.getByText(/annotations/i)).toBeInTheDocument();

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
      http.get("*/knowledge/documents", () => {
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
