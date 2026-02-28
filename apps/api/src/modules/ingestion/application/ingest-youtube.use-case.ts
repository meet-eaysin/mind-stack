import { randomUUID } from 'node:crypto';
import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { IngestionJobProducerPort } from '@/modules/ingestion/domain/ingestion-job-producer.port';
import { createDocument } from '@/modules/ingestion/domain/document.entity';
import { SOURCE_TYPE, INGESTION_STATUS } from '@repo/shared-types';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

const CAPTION_RETRY_DELAYS_MS = [0, 200, 600] as const;
const YOUTUBE_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export class IngestYoutubeUseCase {
  private readonly youtubeCookie: string | undefined;
  private readonly youtubeProxyUrl: string | undefined;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
    options?: {
      youtubeCookie: string | undefined;
      youtubeProxyUrl: string | undefined;
    },
  ) {
    this.youtubeCookie = options?.youtubeCookie?.trim() || undefined;
    this.youtubeProxyUrl = options?.youtubeProxyUrl?.trim() || undefined;
  }

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
    if (!transcript.trim()) {
      throw new BadRequestException(
        'No transcript text found for this video captions',
      );
    }

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
    const response = await this.youtubeFetch(
      `https://www.youtube.com/watch?v=${videoId}`,
    );
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Failed to fetch YouTube page: ${response.status}`,
      );
    }
    const html = await response.text();

    const captionTracksMatch = html.match(/"captionTracks":\[(.*?)\]/s);
    if (!captionTracksMatch?.[1]) {
      throw new BadRequestException('No captions found for this video');
    }

    const captionBaseUrls = Array.from(
      captionTracksMatch[1].matchAll(/"baseUrl":"(.*?)"/g),
    )
      .map((match) => match[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => this.decodeCaptionUrl(value));

    if (captionBaseUrls.length === 0) {
      throw new BadRequestException('No captions found for this video');
    }

    let lastCaptionStatus: number | null = null;
    let sawRateLimit = false;

    for (const baseUrl of captionBaseUrls) {
      const candidates = this.buildCaptionUrlCandidates(baseUrl);
      for (const captionUrl of candidates) {
        const response = await this.fetchCaptionPayloadWithRetry(captionUrl);
        if (!response.payload) {
          if (response.status !== null) {
            lastCaptionStatus = response.status;
          }
          if (response.rateLimited) {
            sawRateLimit = true;
          }
          continue;
        }

        const transcript = this.extractTranscriptFromCaptionPayload(
          response.payload,
        );
        if (transcript) {
          return transcript;
        }
      }
    }

    if (sawRateLimit) {
      throw new ServiceUnavailableException(
        'Failed to fetch captions: 429 (YouTube rate-limited this request). Please retry shortly.',
      );
    }

    if (lastCaptionStatus !== null) {
      throw new ServiceUnavailableException(
        `Failed to fetch captions: ${lastCaptionStatus}`,
      );
    }

    return '';
  }

  private buildCaptionUrlCandidates(baseUrl: string): string[] {
    const candidates = [baseUrl];
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('fmt', 'json3');
      const json3Url = url.toString();
      if (!candidates.includes(json3Url)) {
        candidates.unshift(json3Url);
      }
    } catch {
      // Keep original URL if parsing fails.
    }
    return candidates;
  }

  private async fetchCaptionPayloadWithRetry(captionUrl: string): Promise<{
    payload: string | null;
    status: number | null;
    rateLimited: boolean;
  }> {
    let status: number | null = null;
    let rateLimited = false;

    for (const delay of CAPTION_RETRY_DELAYS_MS) {
      if (delay > 0) {
        await this.sleep(delay);
      }

      try {
        const response = await this.youtubeFetch(captionUrl);
        status = response.status;
        if (response.ok) {
          return {
            payload: await response.text(),
            status,
            rateLimited,
          };
        }

        if (response.status === 429) {
          rateLimited = true;
        }

        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable) {
          return { payload: null, status, rateLimited };
        }
      } catch {
        // Network/transient failure: retry remaining attempts.
      }
    }

    return { payload: null, status, rateLimited };
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private async youtubeFetch(
    input: string,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('User-Agent', YOUTUBE_USER_AGENT);
    headers.set('Accept-Language', 'en-US,en;q=0.9');

    if (this.youtubeCookie) {
      headers.set('Cookie', this.youtubeCookie);
    }

    if (!this.youtubeProxyUrl) {
      return fetch(input, { ...init, headers });
    }

    // Node fetch supports `dispatcher` via undici; use it when a proxy is configured.
    const { ProxyAgent } = await import('undici');
    return fetch(input, {
      ...init,
      headers,
      dispatcher: new ProxyAgent(this.youtubeProxyUrl),
    } as RequestInit & { dispatcher: unknown });
  }

  private decodeCaptionUrl(value: string): string {
    return value
      .replace(/\\u0026/g, '&')
      .replace(/\\u003d/g, '=')
      .replace(/\\\//g, '/');
  }

  private extractTranscriptFromCaptionPayload(payload: string): string {
    const trimmed = payload.trim();
    if (!trimmed) {
      return '';
    }

    const jsonTranscript = this.extractJson3Transcript(trimmed);
    if (jsonTranscript) {
      return jsonTranscript;
    }

    return this.extractXmlTranscript(trimmed);
  }

  private extractJson3Transcript(payload: string): string {
    if (!payload.startsWith('{') && !payload.startsWith('[')) {
      return '';
    }

    try {
      const parsed = JSON.parse(payload) as {
        events?: Array<{ segs?: Array<{ utf8?: string }> }>;
      };

      const segments =
        parsed.events
          ?.flatMap((event) => event.segs ?? [])
          .map((seg) => seg.utf8 ?? '')
          .filter((text) => text.trim().length > 0) ?? [];

      return this.normalizeTranscriptText(segments.join(' '));
    } catch {
      return '';
    }
  }

  private extractXmlTranscript(payload: string): string {
    const textMatches = payload.match(/<text\b[^>]*>([\s\S]*?)<\/text>/g);
    if (!textMatches) {
      return '';
    }

    const text = textMatches
      .map((match) =>
        this.decodeHtmlEntities(match.replace(/<[^>]+>/g, '')).trim(),
      )
      .filter((chunk) => chunk.length > 0)
      .join(' ');

    return this.normalizeTranscriptText(text);
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_match, code) =>
        String.fromCharCode(Number(code)),
      );
  }

  private normalizeTranscriptText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
