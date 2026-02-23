import { describe, it, expect } from "vitest";
import { graphApi } from "../api";

describe("Graph Feature API", () => {
  it("should get graph correctly", async () => {
    const result = await graphApi.get();
    expect(result.nodes).toHaveLength(2);
  });

  it("should build graph correctly", async () => {
    const result = await graphApi.build(true);
    expect(result.success).toBe(true);
  });

  it("should get neighborhood correctly", async () => {
    const result = await graphApi.getNeighborhood("n1");
    expect(result.nodes).toHaveLength(2);
  });

  it("should create relation correctly", async () => {
    const result = await graphApi.createRelation({
      fromId: "doc-1",
      toId: "doc-2",
      type: "IS_PART_OF",
    });
    expect(result.slug).toBe("ok");
  });

  it("should delete relation correctly", async () => {
    await expect(graphApi.deleteRelation("rel-1")).resolves.toBeUndefined();
  });
});
