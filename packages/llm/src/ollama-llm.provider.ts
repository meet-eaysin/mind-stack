import { createLogger } from "@repo/logger";
import type {
  GenerationRequest,
  GenerationResponse,
  LLMProvider,
  StreamChunk,
} from "./llm-provider.interface.js";

export interface OllamaLLMOptions {
  baseUrl: string;
  model: string;
}

export class OllamaLLMProvider implements LLMProvider {
  private readonly logger = createLogger("OllamaLLMProvider");
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: OllamaLLMOptions) {
    this.baseUrl = options.baseUrl;
    this.model = options.model;
    this.logger.info(`Initialized with model: ${this.model}`);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      body: JSON.stringify({
        model: this.model,
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

    const data = (await response.json()) as { response: string };
    return {
      text: data.response,
      finishReason: "stop",
      tokenCount: 0, // Ollama doesn't always provide this in non-stream, default to 0
    };
  }

  async *generateStream(
    request: GenerationRequest
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      body: JSON.stringify({
        model: this.model,
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
      throw new Error(`Ollama stream failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as {
              response: string;
              done: boolean;
            };
            yield {
              text: data.response,
              done: data.done,
            };
          } catch (e) {
            this.logger.error(`Failed to parse Ollama stream chunk: ${e}`);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
