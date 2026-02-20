import { describe, it, expect } from "vitest";
import { ingestionApi } from "../api";

describe("Ingestion Feature API", () => {
  it("should ingest from url", async () => {
    const result = await ingestionApi.url({ url: "https://example.com" });
    expect(result.documentId).toBe("doc-1");
  });

  it("should ingest from text", async () => {
    const result = await ingestionApi.text({ title: "T", content: "C" });
    expect(result.documentId).toBe("doc-2");
  });

  it("should get status", async () => {
    const result = await ingestionApi.getStatus("doc-1");
    expect(result.status).toBe("READY");
  });

  it("should retry correctly", async () => {
    const result = await ingestionApi.retry("fail-doc");
    expect(result.documentId).toBe("fail-doc");
    expect(result.message).toBe("Retried");
  });
});
