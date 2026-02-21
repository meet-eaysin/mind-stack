import { http, HttpResponse } from "msw";
import {
  AddTagRequestSchema,
  RemoveTagRequestSchema,
  AddNoteRequestSchema,
  UpdateNoteRequestSchema,
  UpdateImportanceRequestSchema,
} from "@/features/documents/schemas/documents.schemas";

type MockDocument = {
  tags: string[];
  notes: Array<{
    id: string;
    content: string;
    chunkId: string | null;
    selectedText: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
  importance: number;
};

const mockDocs: Record<string, MockDocument> = {
  "doc-1": {
    tags: ["initial-tag"],
    notes: [],
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
          status: "READY",
          chunkCount: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: "doc-2",
          title: "Test URL Document",
          sourceType: "URL",
          sourceUrl: "https://test.com",
          status: "READY",
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
    const meta: MockDocument = mockDocs[id] || {
      tags: [],
      notes: [],
      importance: 1,
    };

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
        notes: meta.notes,
        importanceScore: meta.importance,
        createdAt: new Date().toISOString(),
      },
    });
  }),
  http.post("*/knowledge/tags", async ({ request }) => {
    const body = await request.json();
    const { documentId, tagName } = AddTagRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], notes: [], importance: 1 };
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
    const { documentId, content, chunkId, selectedText, metadata } =
      AddNoteRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], notes: [], importance: 1 };
    }
    const newNote = {
      id: "note-1",
      content,
      chunkId: chunkId ?? null,
      selectedText: selectedText ?? null,
      metadata: (metadata as Record<string, unknown>) ?? null,
      createdAt: new Date().toISOString(),
    };
    mockDocs[documentId].notes.push(newNote);
    return HttpResponse.json({ noteId: "note-1" });
  }),
  http.put("*/knowledge/notes/:id", async ({ request }) => {
    const body = await request.json();
    const { content } = UpdateNoteRequestSchema.parse(body);
    if (mockDocs["doc-1"]) {
      const note = mockDocs["doc-1"].notes.find((n) => n.id === "note-1");
      if (note) note.content = content;
    }
    return HttpResponse.json({ success: true });
  }),
  http.post("*/knowledge/importance", async ({ request }) => {
    const body = await request.json();
    const { documentId, score } = UpdateImportanceRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], notes: [], importance: 1 };
    }
    mockDocs[documentId].importance = score;
    return HttpResponse.json({ success: true });
  }),
];
