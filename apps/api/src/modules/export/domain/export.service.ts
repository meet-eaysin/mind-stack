import type { ChunkReference, NotionBlock } from "@repo/shared-types";

export function chunksToMarkdown(
  chunks: Array<{
    content: string;
    documentTitle: string;
    tags: string[];
  }>
): string {
  const lines: string[] = ["# Exported Knowledge", ""];

  for (const chunk of chunks) {
    lines.push(`## ${chunk.documentTitle}`);
    lines.push("");
    lines.push(chunk.content);
    lines.push("");
    if (chunk.tags.length > 0) {
      lines.push(`**Tags:** ${chunk.tags.join(", ")}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function chunksToNotionBlocks(
  chunks: Array<{
    content: string;
    documentTitle: string;
    tags: string[];
  }>
): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  blocks.push({
    type: "heading_1",
    content: "Exported Knowledge",
    metadata: {},
  });

  for (const chunk of chunks) {
    blocks.push({
      type: "heading_2",
      content: chunk.documentTitle,
      metadata: {},
    });

    blocks.push({
      type: "paragraph",
      content: chunk.content,
      metadata: {},
    });

    if (chunk.tags.length > 0) {
      blocks.push({
        type: "callout",
        content: `Tags: ${chunk.tags.join(", ")}`,
        metadata: { icon: "🏷️" },
      });
    }

    blocks.push({
      type: "divider",
      content: "",
      metadata: {},
    });
  }

  return blocks;
}
