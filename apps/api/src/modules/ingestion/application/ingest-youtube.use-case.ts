import { randomUUID } from "node:crypto";
import type { DocumentRepository } from "../domain/document-repository.interface.js";
import type { IngestionJobProducer } from "../infrastructure/ingestion-job.producer.js";
import { createDocument } from "../domain/document.entity.js";

export class IngestYoutubeUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducer
  ) {}

  async execute(input: {
    url: string;
    title?: string;
  }): Promise<{ documentId: string }> {
    const videoId = this.extractVideoId(input.url);
    const transcript = await this.fetchTranscript(videoId);

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? `YouTube: ${videoId}`,
      sourceType: "YOUTUBE",
      sourceUrl: input.url,
      rawContent: transcript,
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }

  private extractVideoId(url: string): string {
    const parsed = new URL(url);
    const videoId =
      parsed.searchParams.get("v") ?? parsed.pathname.split("/").pop();
    if (!videoId) {
      throw new Error(`Cannot extract video ID from URL: ${url}`);
    }
    return videoId;
  }

  private async fetchTranscript(videoId: string): Promise<string> {
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.status}`);
    }
    const html = await response.text();

    const captionMatch = html.match(/"captionTracks":\[.*?"baseUrl":"(.*?)"/);
    if (!captionMatch?.[1]) {
      throw new Error("No captions found for this video");
    }

    const captionUrl = captionMatch[1].replace(/\\u0026/g, "&");
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
    }

    const captionXml = await captionResponse.text();
    const textMatches = captionXml.match(/<text[^>]*>(.*?)<\/text>/g);
    if (!textMatches) {
      return "";
    }

    return textMatches
      .map((match) => {
        const content = match.replace(/<[^>]+>/g, "");
        return content
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');
      })
      .join(" ");
  }
}
