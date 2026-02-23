import type { LLMProvider } from '@repo/llm';
import {
  type AskQuestionResponse,
  type ChunkReference,
  type StreamingAskResponseChunk,
} from '@repo/shared-types';

type SemanticSearchPort = {
  execute(input: { query: string; topK?: number }): Promise<ChunkReference[]>;
};

export class AskQuestionUseCase {
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly semanticSearch: SemanticSearchPort,
  ) {}

  async execute(input: {
    question: string;
    tags?: string[];
    topK?: number;
  }): Promise<AskQuestionResponse> {
    const citations = await this.semanticSearch.execute({
      query: input.question,
      topK: input.topK ?? 5,
    });
    const uniqueDocumentCitations = this.dedupeByDocument(citations);
    const weakContext = uniqueDocumentCitations.length < 2;

    if (citations.length === 0) {
      return {
        answer: "I don't have enough information to answer this question.",
        citations: [],
        weakContext: true,
      };
    }

    const contextBlock = citations
      .map(
        (c, i) =>
          `[${i + 1}] (Source: ${c.documentTitle})\n${c.content.trim()}`,
      )
      .join('\n\n');

    const systemPrompt = [
      'You are a knowledgeable assistant that answers questions based on the provided context.',
      'Always cite your sources using [N] notation referring to the context blocks.',
      "If the context doesn't contain enough information, say so clearly.",
      'Be concise and accurate.',
    ].join('\n');

    const prompt = [
      'Context:',
      contextBlock,
      '',
      `Question: ${input.question}`,
      '',
      'Answer with citations:',
    ].join('\n');

    const response = await this.llmProvider.generate({
      prompt,
      systemPrompt,
      temperature: 0.3,
    });

    return {
      answer: response.text,
      citations: uniqueDocumentCitations,
      weakContext,
    };
  }

  async *executeStream(input: {
    question: string;
    tags?: string[];
    topK?: number;
  }): AsyncGenerator<StreamingAskResponseChunk, void, undefined> {
    const citations = await this.semanticSearch.execute({
      query: input.question,
      topK: input.topK ?? 5,
    });

    if (citations.length === 0) {
      yield {
        type: 'text',
        data: "I don't have enough information to answer this question.",
      };
      yield { type: 'done' };
      return;
    }

    yield { type: 'citations', data: this.dedupeByDocument(citations) };

    const contextBlock = citations
      .map((c, i) => `[${i + 1}] (Source: ${c.documentTitle})\n${c.content}`)
      .join('\n\n');

    const systemPrompt = [
      'You are a knowledgeable assistant that answers questions based on the provided context.',
      'Always cite your sources using [N] notation referring to the context blocks.',
      "If the context doesn't contain enough information, say so clearly.",
      'Be concise and accurate.',
    ].join('\n');

    const prompt = [
      'Context:',
      contextBlock,
      '',
      `Question: ${input.question}`,
      '',
      'Answer with citations:',
    ].join('\n');

    const stream = this.llmProvider.generateStream({
      prompt,
      systemPrompt,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield { type: 'text', data: chunk.text };
      }
    }

    yield { type: 'done' };
  }

  private dedupeByDocument(citations: ChunkReference[]): ChunkReference[] {
    const byDocument = new Map<string, ChunkReference>();

    for (const citation of citations) {
      const existing = byDocument.get(citation.documentId);
      if (!existing || citation.score > existing.score) {
        byDocument.set(citation.documentId, citation);
      }
    }

    return Array.from(byDocument.values());
  }
}
