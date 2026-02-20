export const ENDPOINTS = {
  ingestion: {
    url: "/ingest/url",
    text: "/ingest/text",
    pdf: "/ingest/pdf",
    youtube: "/ingest/youtube",
    retry: (id: string) => `/ingest/retry/${id}`,
  },
  knowledge: {
    all: "/knowledge/documents",
    detail: (id: string) => `/knowledge/documents/${id}`,
    status: (id: string) => `/knowledge/documents/${id}/status`,
    tags: "/knowledge/tags",
    notes: "/knowledge/notes",
    note: (id: string) => `/knowledge/notes/${id}`,
    importance: "/knowledge/importance",
  },
  query: {
    search: "/query/search",
    filtered: "/query/search/filtered",
    ask: "/query/ask",
    askStream: "/query/ask/stream",
    retrieve: "/query/retrieve",
  },
  review: {
    daily: "/review/daily",
    feedback: "/review/feedback",
    score: "/review/score",
  },
  graph: {
    all: "/graph",
    build: "/graph/build",
    neighborhood: "/graph/neighborhood",
  },
  export: {
    markdown: "/export/markdown",
    notion: "/export/notion",
  },
} as const;
