export const ENDPOINTS = {
  INGESTION: {
    URL: "/ingest/url",
    TEXT: "/ingest/text",
    PDF: "/ingest/pdf",
    YOUTUBE: "/ingest/youtube",
    RETRY: (id: string) => `/ingest/retry/${id}`,
  },
  KNOWLEDGE: {
    ALL: "/knowledge/documents",
    DETAIL: (id: string) => `/knowledge/documents/${id}`,
    STATUS: (id: string) => `/knowledge/documents/${id}/status`,
    TAGS: "/knowledge/tags",
    NOTES: "/knowledge/notes",
    NOTE: (id: string) => `/knowledge/notes/${id}`,
    IMPORTANCE: "/knowledge/importance",
  },
  QUERY: {
    SEARCH: "/query/search",
    FILTERED: "/query/search/filtered",
    ASK: "/query/ask",
    ASK_STREAM: "/query/ask/stream",
    RETRIEVE: "/query/retrieve",
  },
  REVIEW: {
    DAILY: "/review/daily",
    FEEDBACK: "/review/feedback",
    SCORE: "/review/score",
  },
  GRAPH: {
    ALL: "/graph",
    BUILD: "/graph/build",
    NEIGHBORHOOD: "/graph/neighborhood",
  },
  EXPORT: {
    MARKDOWN: "/export/markdown",
    NOTION: "/export/notion",
  },
  COLLECTIONS: {
    ALL: "/collections",
    DETAIL: (id: string) => `/collections/${id}`,
    ITEMS: (id: string) => `/collections/${id}/items`,
    REORDER: (id: string) => `/collections/${id}/reorder`,
    REMOVE_ITEM: (id: string, docId: string) =>
      `/collections/${id}/items/${docId}`,
  },
  ADMIN: {
    JOBS: "/admin/jobs",
    CLEANUP: "/admin/cleanup",
    HEALTH: {
      MISSING_EMBEDDINGS: "/admin/health/missing-embeddings",
      ORPHANS: "/admin/health/orphans",
      FAILED_DOCUMENTS: "/admin/health/failed-documents",
    },
  },
  ANALYSIS: {
    MASTERY: "/analysis/mastery",
  },
  LEARNING_GOALS: {
    ALL: "/learning-goals",
    DETAIL: (id: string) => `/learning-goals/${id}`,
    ITEMS: (id: string) => `/learning-goals/${id}/items`,
    REMOVE_ITEM: (itemId: string) => `/learning-goals/items/${itemId}`,
  },
} as const;
