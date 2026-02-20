import { describe, it, expect } from "vitest";
import { ENDPOINTS } from "@/constents/endpoints";
import { QUERY_KEYS } from "@/constents/query-keys";

describe("ENDPOINTS", () => {
  it("has ingestion endpoints", () => {
    expect(ENDPOINTS.INGESTION.URL).toBeDefined();
    expect(ENDPOINTS.INGESTION.TEXT).toBeDefined();
    expect(ENDPOINTS.INGESTION.PDF).toBeDefined();
    expect(ENDPOINTS.INGESTION.YOUTUBE).toBeDefined();
  });

  it("has knowledge endpoints", () => {
    expect(ENDPOINTS.KNOWLEDGE.ALL).toBeDefined();
    expect(ENDPOINTS.KNOWLEDGE.DETAIL("id-1")).toContain("id-1");
    expect(ENDPOINTS.KNOWLEDGE.STATUS("id-2")).toContain("id-2");
    expect(ENDPOINTS.KNOWLEDGE.TAGS).toBeDefined();
    expect(ENDPOINTS.KNOWLEDGE.NOTES).toBeDefined();
    expect(ENDPOINTS.KNOWLEDGE.IMPORTANCE).toBeDefined();
  });

  it("has query endpoints", () => {
    expect(ENDPOINTS.QUERY.SEARCH).toBeDefined();
    expect(ENDPOINTS.QUERY.FILTERED).toBeDefined();
    expect(ENDPOINTS.QUERY.ASK).toBeDefined();
    expect(ENDPOINTS.QUERY.ASK_STREAM).toBeDefined();
    expect(ENDPOINTS.QUERY.RETRIEVE).toBeDefined();
  });

  it("has review endpoints", () => {
    expect(ENDPOINTS.REVIEW.DAILY).toBeDefined();
    expect(ENDPOINTS.REVIEW.FEEDBACK).toBeDefined();
    expect(ENDPOINTS.REVIEW.SCORE).toBeDefined();
  });

  it("has graph endpoints", () => {
    expect(ENDPOINTS.GRAPH.ALL).toBeDefined();
    expect(ENDPOINTS.GRAPH.BUILD).toBeDefined();
    expect(ENDPOINTS.GRAPH.NEIGHBORHOOD).toBeDefined();
  });

  it("has export endpoints", () => {
    expect(ENDPOINTS.EXPORT.MARKDOWN).toBeDefined();
    expect(ENDPOINTS.EXPORT.NOTION).toBeDefined();
  });
});

describe("QUERY_KEYS", () => {
  it("generates knowledge list keys with parameters", () => {
    const key = QUERY_KEYS.KNOWLEDGE.LIST(1, 10);
    expect(key).toContain("knowledge");
    expect(key).toContain(1);
    expect(key).toContain(10);
  });

  it("generates knowledge list keys with search", () => {
    const key = QUERY_KEYS.KNOWLEDGE.LIST(1, 10, "test");
    expect(key).toContain("test");
  });

  it("generates knowledge detail keys", () => {
    const key = QUERY_KEYS.KNOWLEDGE.DETAIL("doc-1");
    expect(key).toContain("doc-1");
  });

  it("generates knowledge status keys", () => {
    const key = QUERY_KEYS.KNOWLEDGE.STATUS("doc-2");
    expect(key).toContain("doc-2");
  });

  it("generates review daily keys", () => {
    expect(QUERY_KEYS.REVIEW.DAILY).toBeDefined();
    expect(Array.isArray(QUERY_KEYS.REVIEW.DAILY)).toBe(true);
  });

  it("generates graph all keys", () => {
    expect(QUERY_KEYS.GRAPH.ALL).toBeDefined();
    expect(Array.isArray(QUERY_KEYS.GRAPH.ALL)).toBe(true);
  });

  it("generates export keys", () => {
    expect(QUERY_KEYS.EXPORT.PREVIEW([])).toBeDefined();
  });
});
