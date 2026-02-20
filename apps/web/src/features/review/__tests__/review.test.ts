import { describe, it, expect } from "vitest";
import { reviewApi } from "../api";

describe("Review Feature API", () => {
  it("should get daily review", async () => {
    const result = await reviewApi.getDaily();
    expect(result.items).toHaveLength(2);
    expect(result.date).toBeDefined();
  });

  it("should submit feedback", async () => {
    const result = await reviewApi.submitFeedback("c1", 5);
    expect(result.success).toBe(true);
  });

  it("should update score", async () => {
    const result = await reviewApi.updateScore("c1", 3);
    expect(result.success).toBe(true);
  });
});
