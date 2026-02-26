import { z } from "zod";
import {
  type GenerationRequest,
  type GenerationResponse,
  type LLMProvider,
  type StreamChunk,
} from "./llm-provider.interface.js";

export type OpenRouterLLMOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const ChatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable().optional(),
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      total_tokens: z.number().optional(),
    })
    .optional(),
});

const StreamChunkSchema = z.object({
  choices: z.array(
    z.object({
      finish_reason: z.string().nullable().optional(),
      delta: z
        .object({
          content: z.string().optional(),
        })
        .optional(),
    }),
  ),
});

function toFinishReason(
  value: string | null | undefined,
): "stop" | "length" | "error" {
  if (value === "length") {
    return "length";
  }
  if (value === "content_filter") {
    return "error";
  }
  return "stop";
}

export class OpenRouterLLMProvider implements LLMProvider {
  constructor(private readonly options: OpenRouterLLMOptions) {}

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.options.apiKey}`,
    };
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(
      `${this.options.baseUrl}/api/v1/chat/completions`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            ...(request.systemPrompt
              ? [{ role: "system", content: request.systemPrompt }]
              : []),
            { role: "user", content: request.prompt },
          ],
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      const details = (await response.text()).trim();
      const suffix = details.length > 0 ? ` - ${details}` : "";
      throw new Error(
        `OpenRouter generation failed: ${response.status} ${response.statusText}${suffix}`,
      );
    }

    const payload = ChatResponseSchema.parse(await response.json());
    const first = payload.choices[0];
    if (!first) {
      throw new Error("OpenRouter generation failed: missing choices");
    }

    return {
      text: first.message.content,
      finishReason: toFinishReason(first.finish_reason),
      tokenCount: payload.usage?.total_tokens ?? 0,
    };
  }

  async *generateStream(
    request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const response = await fetch(
      `${this.options.baseUrl}/api/v1/chat/completions`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            ...(request.systemPrompt
              ? [{ role: "system", content: request.systemPrompt }]
              : []),
            { role: "user", content: request.prompt },
          ],
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          stream: true,
        }),
      },
    );

    if (!response.ok || !response.body) {
      const details = (await response.text()).trim();
      const suffix = details.length > 0 ? ` - ${details}` : "";
      throw new Error(
        `OpenRouter stream failed: ${response.status} ${response.statusText}${suffix}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffered += decoder.decode(value, { stream: true });
        const events = buffered.split("\n\n");
        buffered = events.pop() ?? "";

        for (const event of events) {
          const lines = event
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("data:"));

          for (const line of lines) {
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              yield { text: "", done: true };
              return;
            }

            const parsed = StreamChunkSchema.parse(JSON.parse(payload));
            const first = parsed.choices[0];
            if (!first) {
              continue;
            }

            yield {
              text: first.delta?.content ?? "",
              done:
                first.finish_reason !== null &&
                first.finish_reason !== undefined,
            };
          }
        }
      }

      yield { text: "", done: true };
    } finally {
      reader.releaseLock();
    }
  }
}
