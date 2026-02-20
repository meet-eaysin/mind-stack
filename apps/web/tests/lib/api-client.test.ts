import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import {
  isApiError,
  getApiErrorMessage,
  apiClient,
  type ApiError,
} from "@/lib/api-client";

describe("isApiError", () => {
  it("returns true for network errors", () => {
    const error: ApiError = { type: "network", message: "Failed to fetch" };
    expect(isApiError(error)).toBe(true);
  });

  it("returns true for backend errors", () => {
    const error: ApiError = {
      type: "backend",
      status: 404,
      message: "Not found",
    };
    expect(isApiError(error)).toBe(true);
  });

  it("returns true for validation errors", () => {
    const error: ApiError = {
      type: "validation",
      issues: ["field required"],
    };
    expect(isApiError(error)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isApiError(null)).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isApiError("error")).toBe(false);
  });

  it("returns false for plain objects", () => {
    expect(isApiError({ foo: "bar" })).toBe(false);
  });
});

describe("getApiErrorMessage", () => {
  it("returns message for network errors", () => {
    const error: ApiError = { type: "network", message: "Connection refused" };
    expect(getApiErrorMessage(error)).toBe("Connection refused");
  });

  it("returns message for backend errors", () => {
    const error: ApiError = {
      type: "backend",
      status: 500,
      message: "Internal error",
    };
    expect(getApiErrorMessage(error)).toBe("Internal error");
  });

  it("joins issues for validation errors", () => {
    const error: ApiError = {
      type: "validation",
      issues: ["field required", "invalid type"],
    };
    expect(getApiErrorMessage(error)).toBe("field required, invalid type");
  });

  it("returns fallback for non-ApiError values", () => {
    expect(getApiErrorMessage("oops")).toBe("An unknown error occurred");
    expect(getApiErrorMessage(null)).toBe("An unknown error occurred");
    expect(getApiErrorMessage(42)).toBe("An unknown error occurred");
  });
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("throws network error when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network request failed"));

    try {
      await apiClient.get("/test", z.object({ ok: z.boolean() }));
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      const apiErr = err as ApiError;
      if (apiErr.type === "network") {
        expect(apiErr.message).toBe("Network request failed");
      }
    }
  });

  it("throws backend error for non-ok responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    try {
      await apiClient.get("/test", z.object({ ok: z.boolean() }));
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      const apiErr = err as ApiError;
      expect(apiErr.type).toBe("backend");
      if (apiErr.type === "backend") {
        expect(apiErr.status).toBe(404);
        expect(apiErr.message).toBe("Not found");
      }
    }
  });

  it("throws validation error when schema does not match", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ wrong: "data" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    try {
      await apiClient.get("/test", z.object({ ok: z.boolean() }));
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      const apiErr = err as ApiError;
      expect(apiErr.type).toBe("validation");
    }
  });
});
