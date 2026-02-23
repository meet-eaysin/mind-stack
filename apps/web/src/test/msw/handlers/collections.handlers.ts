import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/collections", () => {
    return HttpResponse.json([]);
  }),
];
