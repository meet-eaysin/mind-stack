import { describe, it, expect } from "vitest";
import { documentsApi } from "../api";

describe("Documents Feature API", () => {
  it("should list documents", async () => {
    const result = await documentsApi.list(1, 10);
    expect(result.documents).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should get document detail", async () => {
    const result = await documentsApi.get("doc-1");
    expect(result.document.id).toBe("doc-1");
  });

  it("should add tag", async () => {
    const result = await documentsApi.addTag("c1", "tag1");
    expect(result.success).toBe(true);
  });

  it("should update note", async () => {
    const result = await documentsApi.updateNote("n1", "new content");
    expect(result.success).toBe(true);
  });
});
