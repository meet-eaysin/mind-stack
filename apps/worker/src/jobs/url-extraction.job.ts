import { PrismaClient } from "@repo/database";
import { createLogger } from "@repo/logger";
import { Job, Queue } from "bullmq";
import { JOB_TYPE, INGESTION_STATUS } from "@repo/shared-types";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { LLMProvider } from "@repo/llm";

const logger = createLogger("UrlExtractionJob");

export async function handleUrlExtractionJob(
  job: Job<{ documentId: string; userId?: string }, void, string>,
  prisma: PrismaClient,
  getGenerationProvider: (userId: string) => Promise<LLMProvider>,
  ingestionQueue: Queue,
): Promise<void> {
  const { documentId } = job.data;
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    logger.error("Document not found", { documentId });
    throw new Error(`Document not found: ${documentId}`);
  }

  if (!document.sourceUrl) {
    logger.error("Document missing source URL", { documentId });
    throw new Error(`Document missing source URL: ${documentId}`);
  }

  try {
    const llm = await getGenerationProvider(job.data.userId ?? "default");

    // 1. Fetch
    const response = await fetch(document.sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL (${response.status}): ${response.statusText}`,
      );
    }
    const html = await response.text();

    // 2. Extract
    const dom = new JSDOM(html, { url: document.sourceUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Failed to extract readable content from URL");
    }

    const TurndownService = (await import("turndown")).default;
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    turndownService.addRule("images", {
      filter: "img",
      replacement: function (_content, node) {
        const img = node as HTMLElement;
        const alt = img.getAttribute("alt") || "";
        const src = img.getAttribute("src") || "";
        const title = img.getAttribute("title") || "";
        const titlePart = title ? ' "' + title + '"' : "";
        return src ? "![" + alt + "](" + src + titlePart + ")" : "";
      },
    });

    const initialMarkdown = turndownService.turndown(article.content || "");

    // 3. AI structuring
    const prompt = `
      You are an expert content analyzer. I have some Markdown extracted from a website. 
      It might have some junk formatting, inconsistent headers, or missed structures.
      
      Your task is to:
      1. Extract all meaningful semantic content (articles, lists, key facts).
      2. Remove all nav menus, footers, and redundant UI text.
      3. Preserve the core text structure for AI analysis.
      4. Ensure clean paragraphs and consistent markdown tagging.
      5. Output ONLY the refined Markdown content.
      
      CONTENT:
      ${initialMarkdown}
    `;

    const llmResponse = await llm.generate({ prompt });
    const markdownContent = llmResponse.text;

    // 4. Update Document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        title:
          document.title === new URL(document.sourceUrl).hostname
            ? article.title || document.title
            : document.title,
        rawContent: markdownContent || "",
        status: INGESTION_STATUS.INGESTED,
        processingError: null,
      },
    });

    // 5. Chain to Chunking
    await ingestionQueue.add(JOB_TYPE.CHUNKING, {
      documentId,
      userId: job.data.userId ?? "default",
    });

    logger.info("URL extraction completed", { documentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: INGESTION_STATUS.FAILED, processingError: message },
    });
    logger.error("URL extraction failed", { documentId, error: message });
    throw error;
  }
}
