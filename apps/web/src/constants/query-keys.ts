export const QUERY_KEYS = {
  KNOWLEDGE: {
    LIST: (page: number, pageSize: number, search?: string) =>
      ["knowledge", "list", page, pageSize, search] as const,
    DETAIL: (id: string) => ["knowledge", "detail", id] as const,
    RELATED: (id: string) => ["knowledge", "related", id] as const,
    STATUS: (id: string) => ["knowledge", "status", id] as const,
  },
  REVIEW: {
    DAILY: ["review", "daily"] as const,
  },
  GRAPH: {
    ALL: ["graph", "all"] as const,
  },
  EXPORT: {
    PREVIEW: (ids: string[]) => ["export", "preview", ids] as const,
  },
  SEARCH: {
    HISTORY: ["search", "history"] as const,
    FILTERS: ["search", "filters"] as const,
  },
  ADMIN: {
    METRICS: ["admin", "metrics"] as const,
  },
  COLLECTIONS: {
    LIST: ["collections", "list"] as const,
    DETAIL: (id: string) => ["collections", "detail", id] as const,
  },
  HEALTH: {
    MISSING_EMBEDDINGS: ["health", "missing-embeddings"] as const,
    ORPHANS: ["health", "orphans"] as const,
    FAILED_DOCUMENTS: ["health", "failed-documents"] as const,
    QUEUE_METRICS: ["health", "queue-metrics"] as const,
  },
  ANALYSIS: {
    MASTERY: ["analysis", "mastery"] as const,
  },
  LEARNING_GOALS: {
    LIST: ["learning-goals", "list"] as const,
    DETAIL: (id: string) => ["learning-goals", "detail", id] as const,
  },
  SETTINGS: {
    LLM: ["settings", "llm"] as const,
    EMBEDDING_HEALTH: ["settings", "embedding-health"] as const,
  },
} as const;
