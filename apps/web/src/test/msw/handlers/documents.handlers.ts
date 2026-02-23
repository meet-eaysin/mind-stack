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
    type: "HIGHLIGHT" | "NOTE" | "QUESTION" | "INSIGHT";
    chunkId: string | null;
    selectedText: string | null;
    metadata: Record<string, string | number | boolean | null> | null;
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
          learningStatus: "UPCOMING",
          type: "ARTICLE",
          author: null,
          publisher: null,
          publishedAt: null,
          language: "en",
          addedByUserAt: new Date().toISOString(),
          chunkCount: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: "doc-2",
          title: "Test URL Document",
          sourceType: "URL",
          sourceUrl: "https://test.com",
          status: "READY",
          learningStatus: "UPCOMING",
          type: "ARTICLE",
          author: null,
          publisher: null,
          publishedAt: null,
          language: "en",
          addedByUserAt: new Date().toISOString(),
          chunkCount: 5,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    });
  }),
  http.get("*/knowledge/documents/:id/details", ({ params }) => {
    const id = params.id as string;
    const meta: MockDocument = mockDocs[id] || {
      tags: [],
      notes: [],
      importance: 1,
    };

    return HttpResponse.json({
      id,
      title: "Test PDF Document",
      sourceType: "PDF",
      sourceUrl: null,
      status: "READY",
      learningStatus: "UPCOMING",
      type: "ARTICLE",
      author: null,
      publisher: null,
      publishedAt: null,
      language: "en",
      addedByUserAt: new Date().toISOString(),
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
    });
  }),
  http.get("*/knowledge/documents/:id/related", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json([
      {
        chunkId: `${id}-related-1`,
        documentId: "doc-2",
        content: "Related resource summary",
        documentTitle: "Related Test Document",
        author: "Author A",
        publishedAt: new Date().toISOString(),
        sourceUrl: "https://example.com/related",
        score: 0.88,
        tags: ["related"],
        hasNote: false,
      },
    ]);
  }),
  http.post("*/knowledge/tags/add", async ({ request }) => {
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
  http.post("*/knowledge/tags/remove", async ({ request }) => {
    const body = await request.json();
    const { documentId, tagName } = RemoveTagRequestSchema.parse(body);
    if (mockDocs[documentId]) {
      mockDocs[documentId].tags = mockDocs[documentId].tags.filter(
        (t) => t !== tagName,
      );
    }
    return HttpResponse.json({ success: true });
  }),
  http.post("*/knowledge/notes/add", async ({ request }) => {
    const body = await request.json();
    const { documentId, content, type, chunkId, selectedText, metadata } =
      AddNoteRequestSchema.parse(body);
    if (!mockDocs[documentId]) {
      mockDocs[documentId] = { tags: [], notes: [], importance: 1 };
    }
    const newNote = {
      id: "note-1",
      content,
      type: type ?? "NOTE",
      chunkId: chunkId ?? null,
      selectedText: selectedText ?? null,
      metadata: metadata ?? null,
      createdAt: new Date().toISOString(),
    };
    mockDocs[documentId].notes.push(newNote);
    return HttpResponse.json(newNote);
  }),
  http.post("*/knowledge/notes/update/:id", async ({ request }) => {
    const body = await request.json();
    const { content } = UpdateNoteRequestSchema.parse(body);
    if (mockDocs["doc-1"]) {
      const note = mockDocs["doc-1"].notes.find((n) => n.id === "note-1");
      if (note) note.content = content;
      if (note) {
        return HttpResponse.json({
          ...note,
          type: "NOTE",
        });
      }
    }
    return HttpResponse.json(
      {
        id: "note-1",
        content,
        type: "NOTE",
        chunkId: null,
        selectedText: null,
        metadata: null,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
  http.post("*/knowledge/documents/:id", () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete("*/knowledge/documents/:id", () => {
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
