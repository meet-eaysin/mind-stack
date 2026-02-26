import { z } from "zod";
import {
  type GenerationRequest,
  type GenerationResponse,
  type LLMProvider,
  type StreamChunk,
} from "./llm-provider.interface.js";

export type GeminiLLMOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const GenerateResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        finishReason: z.string().optional(),
        content: z
          .object({
            parts: z
              .array(
                z.object({
                  text: z.string().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
  usageMetadata: z
    .object({
      totalTokenCount: z.number().optional(),
    })
    .optional(),
});

function toFinishReason(
  value: string | undefined,
): "stop" | "length" | "error" {
  if (value === "MAX_TOKENS") {
    return "length";
  }
  if (value === "SAFETY") {
    return "error";
  }
  return "stop";
}

export class GeminiLLMProvider implements LLMProvider {
  constructor(private readonly options: GeminiLLMOptions) {}

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const resourceName = this.options.model.startsWith("models/")
      ? this.options.model
      : `models/${this.options.model}`;
    const url = `${this.options.baseUrl}/v1beta/${resourceName}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.options.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: request.prompt }],
          },
        ],
        ...(request.systemPrompt
          ? {
              systemInstruction: {
                parts: [{ text: request.systemPrompt }],
              },
            }
          : {}),
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const details = (await response.text()).trim();
      const suffix = details.length > 0 ? ` - ${details}` : "";
      throw new Error(
        `Gemini generation failed: ${response.status} ${response.statusText}${suffix}`,
      );
    }

    const payload = GenerateResponseSchema.parse(await response.json());
    const first = payload.candidates?.[0];
    const text = (first?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .filter((part) => part.length > 0)
      .join("\n");

    return {
      text,
      finishReason: toFinishReason(first?.finishReason),
      tokenCount: payload.usageMetadata?.totalTokenCount ?? 0,
    };
  }

  async *generateStream(
    request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const result = await this.generate(request);
    yield {
      text: result.text,
      done: true,
    };
  }
}
