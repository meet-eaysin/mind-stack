import { z } from "zod";
import { env } from "../lib/env";

export type ApiError =
  | { type: "network"; message: string }
  | { type: "backend"; status: number; message: string }
  | { type: "validation"; issues: readonly string[] };

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) return false;
  const e = error as Record<string, unknown>; // Safe narrowing for inspection
  return (
    (e["type"] === "network" && typeof e["message"] === "string") ||
    (e["type"] === "backend" &&
      typeof e["status"] === "number" &&
      typeof e["message"] === "string") ||
    (e["type"] === "validation" && Array.isArray(e["issues"]))
  );
}

const ErrorResponseSchema = z.object({
  message: z.string(),
});

async function handleResponse<T>(
  response: Response,
  schema: z.ZodSchema<T>,
): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An unexpected error occurred";
    try {
      const errorData = await response.json();
      const parsed = ErrorResponseSchema.safeParse(errorData);
      if (parsed.success) {
        errorMessage = parsed.data.message;
      }
    } catch {
      // Failed to parse JSON error, fallback to default message
    }

    // Explicitly construct the error object matching ApiError union
    const backendError: ApiError = {
      type: "backend",
      status: response.status,
      message: errorMessage,
    };
    throw backendError;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    const networkError: ApiError = {
      type: "network",
      message: "Failed to parse JSON response",
    };
    throw networkError;
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    console.error("API Validation Error:", result.error);
    const issues = result.error.issues.map((i) => i.message);
    const validationError: ApiError = {
      type: "validation",
      issues,
    };
    throw validationError;
  }

  return result.data;
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, init);
    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Network request failed";
    const networkError: ApiError = { type: "network", message };
    throw networkError;
  }
}

export const apiClient = {
  get: async <T>(path: string, schema: z.ZodSchema<T>): Promise<T> => {
    const response = await safeFetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse(response, schema);
  },

  post: async <T, B>(
    path: string,
    body: B,
    schema: z.ZodSchema<T>,
  ): Promise<T> => {
    const response = await safeFetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response, schema);
  },

  put: async <T, B>(
    path: string,
    body: B,
    schema: z.ZodSchema<T>,
  ): Promise<T> => {
    const response = await safeFetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response, schema);
  },

  delete: async <T, B>(
    path: string,
    body: B,
    schema: z.ZodSchema<T>,
  ): Promise<T> => {
    const response = await safeFetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response, schema);
  },
};
