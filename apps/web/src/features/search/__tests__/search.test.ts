import { describe, it, expect } from "vitest";
import { searchApi } from "../api";

describe("Search Feature API", () => {
  it("should perform semantic search", async () => {
    const result = await searchApi.search("query");
    expect(result.documents).toHaveLength(1);
  });

  it("should ask question", async () => {
    const result = await searchApi.ask("question");
    expect(result.answer).toBe("This is a mock AI answer.");
  });

  it("should perform retrieve", async () => {
    const result = await searchApi.retrieve("query");
    expect(result.chunks).toHaveLength(0); // Mocked as empty
  });
});
