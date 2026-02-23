import { handlers as ingestionHandlers } from "./handlers/ingestion.handlers";
import { handlers as documentsHandlers } from "./handlers/documents.handlers";
import { handlers as searchHandlers } from "./handlers/search.handlers";
import { handlers as reviewHandlers } from "./handlers/review.handlers";
import { handlers as graphHandlers } from "./handlers/graph.handlers";
import { handlers as exportHandlers } from "./handlers/export.handlers";
import { handlers as collectionsHandlers } from "./handlers/collections.handlers";
import { handlers as healthHandlers } from "./handlers/health.handlers";
import { handlers as productivityHandlers } from "./handlers/productivity.handlers";

export const handlers = [
  ...ingestionHandlers,
  ...documentsHandlers,
  ...searchHandlers,
  ...reviewHandlers,
  ...graphHandlers,
  ...exportHandlers,
  ...collectionsHandlers,
  ...healthHandlers,
  ...productivityHandlers,
];
