export const QUERY_KEYS = {
  knowledge: {
    list: (page: number, pageSize: number, search?: string) =>
      ["knowledge", "list", page, pageSize, search] as const,
    detail: (id: string) => ["knowledge", "detail", id] as const,
    status: (id: string) => ["knowledge", "status", id] as const,
  },
  review: {
    daily: ["review", "daily"] as const,
  },
  graph: {
    all: ["graph", "all"] as const,
  },
  export: {
    preview: (ids: string[]) => ["export", "preview", ids] as const,
  },
} as const;
