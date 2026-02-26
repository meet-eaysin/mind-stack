import { describe, expect, it } from "vitest";
import { settingsApi } from "../api";
import { MODEL_CAPABILITY, MODEL_PROVIDER } from "@repo/shared-types";

describe("Settings Feature API", () => {
  it("gets llm config", async () => {
    const result = await settingsApi.getLlmConfig();

    expect(result.provider).toBe(MODEL_PROVIDER.OLLAMA);
    expect(result.model).toBe("llama3");
    expect(result.enabledCapabilities).toEqual([
      MODEL_CAPABILITY.CHAT,
      MODEL_CAPABILITY.EMBEDDING,
    ]);
  });

  it("updates llm config", async () => {
    const result = await settingsApi.updateLlmConfig({
      provider: MODEL_PROVIDER.OPENAI,
      model: "gpt-4o-mini",
      baseUrl: "https://api.openai.com",
      apiKey: "sk-test",
      enabledCapabilities: [MODEL_CAPABILITY.CHAT],
    });

    expect(result.provider).toBe(MODEL_PROVIDER.OPENAI);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.baseUrl).toBe("https://api.openai.com");
    expect(result.hasApiKey).toBe(true);
    expect(result.enabledCapabilities).toEqual([MODEL_CAPABILITY.CHAT]);
  });

  it("deletes llm config", async () => {
    const result = await settingsApi.deleteLlmConfig();
    expect(result.deleted).toBe(true);
  });

  it("gets embedding model health", async () => {
    const result = await settingsApi.getEmbeddingModelHealth();

    expect(result.provider).toBe(MODEL_PROVIDER.OLLAMA);
    expect(result.available).toBe(true);
  });
});

