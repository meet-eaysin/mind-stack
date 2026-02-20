import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("*/export/markdown", () => {
    return HttpResponse.json({ markdown: "# Mock Markdown" });
  }),
  http.post("*/export/notion", () => {
    return HttpResponse.json({
      payload: [{ type: "paragraph", content: "mock", metadata: {} }],
    });
  }),
];
