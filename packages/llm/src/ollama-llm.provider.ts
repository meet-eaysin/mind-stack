import { createLogger } from "@repo/logger";
import type {
  GenerationRequest,
  GenerationResponse,
  LLMProvider,
  StreamChunk,
} from "./llm-provider.interface.js";

interface OllamaGenerateBody {
  model: string;
  prompt: string;
  system?: string;
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export class OllamaLLMProvider implements LLMProvider {
  private readonly logger = createLogger("OllamaLLMProvider");
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const body: OllamaGenerateBody = {
      model: this.model,
      prompt: request.prompt,
      stream: false,
      ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      options: {
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
        ...(request.maxTokens !== undefined
          ? { num_predict: request.maxTokens }
          : {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama generate failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    return {
      text: data.response,
      finishReason: data.done ? "stop" : "length",
      tokenCount: data.eval_count ?? 0,
    };
  }

  async *generateStream(
    request: GenerationRequest
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const body: OllamaGenerateBody = {
      model: this.model,
      prompt: request.prompt,
      stream: true,
      ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      options: {
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
        ...(request.maxTokens !== undefined
          ? { num_predict: request.maxTokens }
          : {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama stream failed: ${response.status} ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("Ollama stream response has no body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length === 0) continue;

          const chunk = JSON.parse(trimmed) as OllamaGenerateResponse;
          yield {
            text: chunk.response,
            done: chunk.done,
          };
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
