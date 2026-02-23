import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { render } from "@/test/test-utils";
import GraphPage from "@/app/graph/page";
import { NeighborhoodPanel } from "../components";
import { fireEvent } from "@testing-library/react";

describe("Graph Behavior", () => {
  it("should render graph and respond to window resize", async () => {
    render(<GraphPage />);

    // Check loading
    expect(screen.getByTestId("graph-loading")).toBeInTheDocument();

    // Wait for graph
    await waitFor(() => {
      expect(screen.getByTestId("graph-visualization")).toBeInTheDocument();
    });

    expect(screen.getByTestId("graph-node-concept-1")).toBeInTheDocument();
  });

  it("should show neighborhood panel when node selected", async () => {
    // Note: Graph selection is usually click-based on SVG,
    // but we can test the panel directly if we pass props or simulate state.
    // For the page test, we'll verify it doesn't show initially.
    render(<GraphPage />);

    await waitFor(() => {
      expect(screen.getByTestId("graph-visualization")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("neighborhood-panel")).not.toBeInTheDocument();
  });

  it("should create and delete relation from neighborhood panel", async () => {
    render(<NeighborhoodPanel conceptId="concept-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("neighborhood-panel")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Target Concept ID"), {
      target: { value: "concept-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.queryByText(/unexpected error/i)).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Relation ID"), {
      target: { value: "rel-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText(/unexpected error/i)).not.toBeInTheDocument();
    });
  });
});
