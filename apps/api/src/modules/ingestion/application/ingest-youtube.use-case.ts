import { randomUUID } from 'node:crypto';
import type { DocumentRepository } from '../domain/document-repository.interface';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port';
import { createDocument } from '../domain/document.entity';
import { SOURCE_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class IngestYoutubeUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    url: string;
    title?: string;
    userId: string;
  }): Promise<{ documentId: string; jobId?: string }> {
    const existing = await this.documentRepository.findBySourceUrl(
      input.url,
      input.userId,
    );
    if (existing) {
      if (
        existing.status !== INGESTION_STATUS.FAILED &&
        existing.status !== INGESTION_STATUS.READY
      ) {
        return { documentId: existing.id };
      }
      if (existing.status === INGESTION_STATUS.READY) {
        return { documentId: existing.id };
      }
    }

    const videoId = this.extractVideoId(input.url);
    const transcript = await this.fetchTranscript(videoId);

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? `YouTube: ${videoId}`,
      userId: input.userId,
      sourceType: SOURCE_TYPE.YOUTUBE,
      sourceUrl: input.url,
      rawContent: transcript,
    });

    const saved = await this.documentRepository.save(document);
    const jobId = await this.jobProducer.enqueueChunkingJob(
      saved.id,
      input.userId,
    );
    return { documentId: saved.id, jobId };
  }

  private extractVideoId(url: string): string {
    const parsed = new URL(url);
    const videoId =
      parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop();
    if (!videoId) {
      throw new BadRequestException(`Cannot extract video ID from URL: ${url}`);
    }
    return videoId;
  }

  private async fetchTranscript(videoId: string): Promise<string> {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Failed to fetch YouTube page: ${response.status}`,
      );
    }
    const html = await response.text();

    const captionMatch = html.match(/"captionTracks":\[.*?"baseUrl":"(.*?)"/);
    if (!captionMatch?.[1]) {
      throw new BadRequestException('No captions found for this video');
    }

    const captionUrl = captionMatch[1].replace(/\\u0026/g, '&');
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) {
      throw new ServiceUnavailableException(
        `Failed to fetch captions: ${captionResponse.status}`,
      );
    }

    const captionXml = await captionResponse.text();
    const textMatches = captionXml.match(/<text[^>]*>(.*?)<\/text>/g);
    if (!textMatches) {
      return '';
    }

    return textMatches
      .map((match) => {
        const content = match.replace(/<[^>]+>/g, '');
        return content
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');
      })
      .join(' ');
  }
}
