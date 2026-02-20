import { describe, it, expect } from "vitest";
import { graphApi } from "../api";

describe("Graph Feature API", () => {
  it("should get graph correctly", async () => {
    const result = await graphApi.get();
    expect(result.nodes).toHaveLength(1);
  });

  it("should build graph correctly", async () => {
    const result = await graphApi.build(true);
    expect(result.success).toBe(true);
  });

  it("should get neighborhood correctly", async () => {
    const result = await graphApi.getNeighborhood("n1");
    expect(result.nodes).toHaveLength(1);
  });
});
