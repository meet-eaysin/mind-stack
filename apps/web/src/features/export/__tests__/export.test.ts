import { describe, it, expect } from "vitest";
import { exportApi } from "../api";
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";

describe("Export Feature API", () => {
  it("should export markdown correctly", async () => {
    const result = await exportApi.markdown(["chunk-1", "chunk-2"]);
    expect(result.markdown).toBe("# Mock Markdown");
  });

  it("should export notion correctly", async () => {
    const result = await exportApi.notion(["chunk-1"]);
    expect(result.payload).toHaveLength(1);
    expect(result.payload[0].type).toBe("paragraph");
  });

  it("should handle export errors", async () => {
    // Override handler for this test
    server.use(
      http.post("*/export/markdown", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(exportApi.markdown(["1"])).rejects.toThrow();
  });
});
