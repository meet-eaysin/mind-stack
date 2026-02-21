import { http, HttpResponse } from "msw";
import {
  AddTagRequestSchema,
  RemoveTagRequestSchema,
  AddNoteRequestSchema,
  UpdateNoteRequestSchema,
  UpdateImportanceRequestSchema,
} from "@/features/documents/schemas/documents.schemas";

const mockDocs: Record<
  string,
  { tags: string[]; note: string | null; importance: number }
> = {
  "doc-1": {
    tags: ["initial-tag"],
    note: null,
    importance: 3,
  },
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
    const id = params.id as string;
    const meta = mockDocs[id] || { tags: [], note: null, importance: 1 };

    return HttpResponse.json({
      document: {
        id,
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
            createdAt: new Date().toISOString(),
          },
        ],
        tags: meta.tags,
        note: meta.note,
        importanceScore: meta.importance,
        createdAt: new Date().toISOString(),
      },
    });
  }),
  http.post("*/knowledge/tags", async ({ request }) => {
    const body = await request.json();
    const { documentId, tagName } = AddTagRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], note: null, importance: 1 };
    }
    if (!mockDocs[documentId].tags.includes(tagName)) {
      mockDocs[documentId].tags.push(tagName);
    }
    return HttpResponse.json({ success: true });
  }),
  http.delete("*/knowledge/tags", async ({ request }) => {
    const body = await request.json();
    const { documentId, tagName } = RemoveTagRequestSchema.parse(body);
    if (mockDocs[documentId]) {
      mockDocs[documentId].tags = mockDocs[documentId].tags.filter(
        (t) => t !== tagName,
      );
    }
    return HttpResponse.json({ success: true });
  }),
  http.post("*/knowledge/notes", async ({ request }) => {
    const body = await request.json();
    const { documentId, content } = AddNoteRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], note: null, importance: 1 };
    }
    mockDocs[documentId].note = content;
    return HttpResponse.json({ noteId: "note-1" });
  }),
  http.put("*/knowledge/notes/:id", async ({ request }) => {
    const body = await request.json();
    const { content } = UpdateNoteRequestSchema.parse(body);
    // In a real mock we'd find by noteId, but for simplicity:
    if (mockDocs["doc-1"]) {
      mockDocs["doc-1"].note = content;
    }
    return HttpResponse.json({ success: true });
  }),
  http.post("*/knowledge/importance", async ({ request }) => {
    const body = await request.json();
    const { documentId, score } = UpdateImportanceRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], note: null, importance: 1 };
    }
    mockDocs[documentId].importance = score;
    return HttpResponse.json({ success: true });
  }),
];
