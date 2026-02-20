import { describe, it, expect } from "vitest";
import * as schemas from "@/schemas/api.schemas";

describe("Zod Schemas", () => {
  describe("IngestionStatusSchema", () => {
    it("accepts valid statuses", () => {
      expect(schemas.IngestionStatusSchema.parse("INGESTED")).toBe("INGESTED");
      expect(schemas.IngestionStatusSchema.parse("READY")).toBe("READY");
      expect(schemas.IngestionStatusSchema.parse("FAILED")).toBe("FAILED");
    });

    it("rejects invalid statuses", () => {
      expect(() => schemas.IngestionStatusSchema.parse("INVALID")).toThrow();
    });
  });

  describe("SourceTypeSchema", () => {
    it("accepts valid source types", () => {
      expect(schemas.SourceTypeSchema.parse("URL")).toBe("URL");
      expect(schemas.SourceTypeSchema.parse("TEXT")).toBe("TEXT");
      expect(schemas.SourceTypeSchema.parse("PDF")).toBe("PDF");
      expect(schemas.SourceTypeSchema.parse("YOUTUBE")).toBe("YOUTUBE");
    });

    it("rejects invalid source types", () => {
      expect(() => schemas.SourceTypeSchema.parse("DOCX")).toThrow();
    });
  });

  describe("DocumentListItemSchema", () => {
    it("parses valid document list items", () => {
      const input = {
        id: "doc-1",
        title: "Test Doc",
        sourceType: "URL",
        sourceUrl: "https://example.com",
        chunkCount: 5,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = schemas.DocumentListItemSchema.parse(input);
      expect(result.id).toBe("doc-1");
      expect(result.title).toBe("Test Doc");
      expect(result.chunkCount).toBe(5);
    });

    it("allows null sourceUrl", () => {
      const input = {
        id: "doc-2",
        title: "Text Doc",
        sourceType: "TEXT",
        sourceUrl: null,
        chunkCount: 3,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = schemas.DocumentListItemSchema.parse(input);
      expect(result.sourceUrl).toBeNull();
    });

    it("rejects missing required fields", () => {
      expect(() =>
        schemas.DocumentListItemSchema.parse({ id: "doc-3" }),
      ).toThrow();
    });
  });

  describe("DocumentListResponseSchema", () => {
    it("parses paginated responses", () => {
      const input = {
        documents: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };
      const result = schemas.DocumentListResponseSchema.parse(input);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });
  });

  describe("ChunkSchema", () => {
    it("parses valid chunks", () => {
      const input = {
        id: "chunk-1",
        content: "Some content",
        startOffset: 0,
        endOffset: 100,
        tags: ["tag1", "tag2"],
        note: "A note",
        importanceScore: 3,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = schemas.ChunkSchema.parse(input);
      expect(result.tags).toHaveLength(2);
      expect(result.importanceScore).toBe(3);
    });

    it("allows null note and importanceScore", () => {
      const input = {
        id: "chunk-2",
        content: "Content",
        startOffset: 0,
        endOffset: 50,
        tags: [],
        note: null,
        importanceScore: null,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = schemas.ChunkSchema.parse(input);
      expect(result.note).toBeNull();
      expect(result.importanceScore).toBeNull();
    });
  });

  describe("ChunkReferenceSchema", () => {
    it("parses search result chunks", () => {
      const input = {
        chunkId: "chunk-1",
        content: "Matching content",
        documentTitle: "Doc Title",
        score: 0.95,
        tags: ["relevant"],
      };
      const result = schemas.ChunkReferenceSchema.parse(input);
      expect(result.score).toBe(0.95);
    });
  });

  describe("IngestionResponseSchema", () => {
    it("parses ingestion responses", () => {
      const input = {
        documentId: "doc-new",
        status: "INGESTED",
        message: "Document ingested successfully",
      };
      const result = schemas.IngestionResponseSchema.parse(input);
      expect(result.documentId).toBe("doc-new");
    });
  });

  describe("ReviewItemSchema", () => {
    it("parses review items", () => {
      const input = {
        chunkId: "chunk-1",
        content: "Review content",
        documentTitle: "Test Doc",
        summary: "A summary",
        reason: "Due for review",
        lastReviewedAt: null,
      };
      const result = schemas.ReviewItemSchema.parse(input);
      expect(result.lastReviewedAt).toBeNull();
    });
  });

  describe("GraphResponseSchema", () => {
    it("parses graph data", () => {
      const input = {
        nodes: [{ id: "n1", label: "Concept A", chunkCount: 3 }],
        edges: [{ fromId: "n1", toId: "n2", relationType: "RELATES_TO" }],
      };
      const result = schemas.GraphResponseSchema.parse(input);
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(1);
    });
  });

  describe("StreamingAskResponseChunkSchema", () => {
    it("parses text chunks", () => {
      const input = { type: "text", data: "Hello " };
      const result = schemas.StreamingAskResponseChunkSchema.parse(input);
      expect(result.type).toBe("text");
    });

    it("parses done chunks", () => {
      const input = { type: "done" };
      const result = schemas.StreamingAskResponseChunkSchema.parse(input);
      expect(result.type).toBe("done");
    });

    it("parses citation chunks", () => {
      const input = {
        type: "citations",
        data: [
          {
            chunkId: "c1",
            content: "cite",
            documentTitle: "Doc",
            score: 0.9,
            tags: [],
          },
        ],
      };
      const result = schemas.StreamingAskResponseChunkSchema.parse(input);
      expect(result.type).toBe("citations");
    });
  });

  describe("ExportMarkdownResponseSchema", () => {
    it("parses markdown export", () => {
      const input = { markdown: "# Hello\n\nWorld" };
      const result = schemas.ExportMarkdownResponseSchema.parse(input);
      expect(result.markdown).toContain("# Hello");
    });
  });

  describe("Validation request schemas", () => {
    it("IngestUrlRequestSchema requires valid URL", () => {
      expect(() =>
        schemas.IngestUrlRequestSchema.parse({ url: "not-a-url" }),
      ).toThrow();
      expect(
        schemas.IngestUrlRequestSchema.parse({ url: "https://example.com" }),
      ).toBeTruthy();
    });

    it("IngestTextRequestSchema requires non-empty fields", () => {
      expect(() =>
        schemas.IngestTextRequestSchema.parse({ title: "", content: "" }),
      ).toThrow();
      expect(
        schemas.IngestTextRequestSchema.parse({
          title: "Test",
          content: "Content",
        }),
      ).toBeTruthy();
    });

    it("UpdateImportanceRequestSchema validates score range", () => {
      expect(() =>
        schemas.UpdateImportanceRequestSchema.parse({
          chunkId: "c1",
          score: 0,
        }),
      ).toThrow();
      expect(() =>
        schemas.UpdateImportanceRequestSchema.parse({
          chunkId: "c1",
          score: 6,
        }),
      ).toThrow();
      expect(
        schemas.UpdateImportanceRequestSchema.parse({
          chunkId: "c1",
          score: 3,
        }),
      ).toBeTruthy();
    });
  });
});
