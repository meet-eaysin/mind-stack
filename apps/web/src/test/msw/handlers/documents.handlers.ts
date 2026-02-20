import { http, HttpResponse } from "msw";
import {
  AddTagRequestSchema,
  RemoveTagRequestSchema,
  AddNoteRequestSchema,
  UpdateNoteRequestSchema,
  UpdateImportanceRequestSchema,
} from "@/features/documents/schemas/documents.schemas";

const mockChunks: Record<string, string[]> = {
  "chunk-1": ["initial-tag"],
};

const mockNotes: Record<string, string | null> = {
  "chunk-1": null,
};

const mockImportance: Record<string, number> = {
  "chunk-1": 3,
};

export const handlers = [
  http.get("*/knowledge/documents", () => {
    return HttpResponse.json({
      documents: [
        {
          id: "doc-1",
          title: "Test PDF Document",
          sourceType: "PDF",
          sourceUrl: null,
          chunkCount: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: "doc-2",
          title: "Test URL Document",
          sourceType: "URL",
          sourceUrl: "https://test.com",
          chunkCount: 5,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    });
  }),
  http.get("*/knowledge/documents/:id", ({ params }) => {
    return HttpResponse.json({
      document: {
        id: params.id as string,
        title: "Test PDF Document",
        sourceType: "PDF",
        sourceUrl: null,
        status: "READY",
        rawContent: "Test content",
        chunks: [
          {
            id: "chunk-1",
            content: "This is a test chunk content.",
            startOffset: 0,
            endOffset: 100,
            importanceScore: mockImportance["chunk-1"],
            tags: mockChunks["chunk-1"] || [],
            note: mockNotes["chunk-1"] || null,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      },
    });
  }),
  http.post("*/knowledge/tags", async ({ request }) => {
    const body = await request.json();
    const { chunkId, tagName } = AddTagRequestSchema.parse(body);
    if (!mockChunks[chunkId]) mockChunks[chunkId] = [];
    if (!mockChunks[chunkId].includes(tagName)) {
      mockChunks[chunkId].push(tagName);
    }
    return HttpResponse.json({ success: true });
  }),
  http.delete("*/knowledge/tags", async ({ request }) => {
    const body = await request.json();
    const { chunkId, tagName } = RemoveTagRequestSchema.parse(body);
    if (mockChunks[chunkId]) {
      mockChunks[chunkId] = mockChunks[chunkId].filter((t) => t !== tagName);
    }
    return HttpResponse.json({ success: true });
  }),
  http.post("*/knowledge/notes", async ({ request }) => {
    const body = await request.json();
    const { chunkId, content } = AddNoteRequestSchema.parse(body);
    mockNotes[chunkId] = content;
    return HttpResponse.json({ noteId: "note-1" });
  }),
  http.put("*/knowledge/notes/:id", async ({ request }) => {
    const body = await request.json();
    const { content } = UpdateNoteRequestSchema.parse(body);
    mockNotes["chunk-1"] = content;
    return HttpResponse.json({ success: true });
  }),
  http.post("*/knowledge/importance", async ({ request }) => {
    const body = await request.json();
    const { chunkId, score } = UpdateImportanceRequestSchema.parse(body);
    mockImportance[chunkId] = score;
    return HttpResponse.json({ success: true });
  }),
];
