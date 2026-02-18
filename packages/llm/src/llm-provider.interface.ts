export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationResponse {
  text: string;
  finishReason: "stop" | "length" | "error";
  tokenCount: number;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface LLMProvider {
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  generateStream(
    request: GenerationRequest
  ): AsyncGenerator<StreamChunk, void, undefined>;
}
