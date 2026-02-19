export type GenerationRequest = {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
};

export type GenerationResponse = {
  text: string;
  finishReason: "stop" | "length" | "error";
  tokenCount: number;
};

export type StreamChunk = {
  text: string;
  done: boolean;
};

export type LLMProvider = {
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  generateStream(
    request: GenerationRequest,
  ): AsyncGenerator<StreamChunk, void, undefined>;
};
