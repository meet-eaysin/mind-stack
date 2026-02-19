import { z } from "zod";
import { createLogger } from "@repo/logger";
import {
  type GenerationRequest,
  type GenerationResponse,
  type LLMProvider,
  type StreamChunk,
} from "./llm-provider.interface.js";

export type OllamaLLMOptions = {
  baseUrl: string;
  model: string;
};

const GenerateResponseSchema = z.object({
  response: z.string(),
  done: z.boolean(),
  done_reason: z.string().optional(),
  eval_count: z.number().optional(),
});

const StreamResponseSchema = z.object({
  response: z.string(),
  done: z.boolean(),
});

const logger = createLogger("OllamaLLMProvider");

export class OllamaLLMProvider implements LLMProvider {
  constructor(private readonly options: OllamaLLMOptions) {
    logger.info(`Initialized with model: ${this.options.model}`);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(`${this.options.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.options.model,
        prompt: request.prompt,
        system: request.systemPrompt,
        stream: false,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama generation failed: ${response.statusText}`);
    }

    const rawData: unknown = await response.json();
    const data = GenerateResponseSchema.parse(rawData);

    return {
      text: data.response,
      finishReason:
        data.done_reason === "stop"
          ? "stop"
          : data.done_reason === "length"
            ? "length"
            : "stop",
      tokenCount: data.eval_count ?? 0,
    };
  }

  async *generateStream(
    request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const response = await fetch(`${this.options.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.options.model,
        prompt: request.prompt,
        system: request.systemPrompt,
        stream: true,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(
        `Ollama stream generation failed: ${response.statusText}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            const rawData: unknown = JSON.parse(line);
            const data = StreamResponseSchema.parse(rawData);
            yield {
              text: data.response,
              done: data.done,
            };
          } catch (e) {
            logger.error("Failed to parse Ollama stream chunk", { error: e });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
