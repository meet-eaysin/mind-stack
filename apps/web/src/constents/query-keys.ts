export const QUERY_KEYS = {
  KNOWLEDGE: {
    LIST: (page: number, pageSize: number, search?: string) =>
      ["knowledge", "list", page, pageSize, search] as const,
    DETAIL: (id: string) => ["knowledge", "detail", id] as const,
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
} as const;
