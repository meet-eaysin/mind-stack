import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useDeleteLlmConfig,
  useEmbeddingModelHealth,
  useLlmConfig,
  useUpdateLlmConfig,
} from "../hooks";
import { settingsApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import { MODEL_CAPABILITY, MODEL_PROVIDER } from "@repo/shared-types";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("Settings Hooks", () => {
  it("loads llm config with useLlmConfig", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useLlmConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.provider).toBe(MODEL_PROVIDER.OLLAMA);
    expect(result.current.data?.model).toBe("llama3");
  });

  it("loads embedding health with useEmbeddingModelHealth", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useEmbeddingModelHealth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.available).toBe(true);
  });

  it("updates config and invalidates related queries", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    queryClient.setQueryData(QUERY_KEYS.SETTINGS.LLM, {
      userId: "default",
      provider: MODEL_PROVIDER.OLLAMA,
      model: "llama3",
      baseUrl: "http://localhost:11434",
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
      hasApiKey: false,
    });
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const apiSpy = vi.spyOn(settingsApi, "updateLlmConfig");
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useUpdateLlmConfig(), { wrapper });

    await result.current.mutateAsync({
      provider: MODEL_PROVIDER.OPENAI,
      model: "gpt-4o-mini",
      baseUrl: "https://api.openai.com",
      apiKey: "sk-test",
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.SETTINGS.LLM,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.SETTINGS.EMBEDDING_HEALTH,
    });
  });

  it("deletes config and invalidates related queries", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const apiSpy = vi.spyOn(settingsApi, "deleteLlmConfig");
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useDeleteLlmConfig(), { wrapper });

    await result.current.mutateAsync();

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.SETTINGS.LLM,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.SETTINGS.EMBEDDING_HEALTH,
    });
  });
});
