import { chunksToMarkdown, chunksToNotionBlocks } from '../export.service.js';

// ── Fixtures ──

function createChunkInput(
  overrides: Partial<{
    content: string;
    documentTitle: string;
    tags: string[];
  }> = {},
): { content: string; documentTitle: string; tags: string[] } {
  return {
    content: 'Some content',
    documentTitle: 'Document Title',
    tags: [],
    ...overrides,
  };
}

// ── Tests ──

describe('chunksToMarkdown', () => {
  it('should format chunks as markdown with headers and content', () => {
    const chunks = [
      createChunkInput({
        content: 'Hello world',
        documentTitle: 'Greetings',
        tags: ['hello'],
      }),
    ];

    const result = chunksToMarkdown(chunks);

    expect(result).toContain('# Exported Knowledge');
    expect(result).toContain('## Greetings');
    expect(result).toContain('Hello world');
    expect(result).toContain('**Tags:** hello');
    expect(result).toContain('---');
  });

  it('should omit the tags line when there are no tags', () => {
    const chunks = [
      createChunkInput({
        content: 'No tags here',
        documentTitle: 'Doc',
        tags: [],
      }),
    ];

    const result = chunksToMarkdown(chunks);

    expect(result).not.toContain('**Tags:**');
  });

  it('should handle multiple chunks', () => {
    const chunks = [
      createChunkInput({ documentTitle: 'Doc A', content: 'Content A' }),
      createChunkInput({ documentTitle: 'Doc B', content: 'Content B' }),
    ];

    const result = chunksToMarkdown(chunks);

    expect(result).toContain('## Doc A');
    expect(result).toContain('## Doc B');
  });

  it('should return header only for empty input', () => {
    const result = chunksToMarkdown([]);

    expect(result).toContain('# Exported Knowledge');
    expect(result).not.toContain('##');
  });
});

describe('chunksToNotionBlocks', () => {
  it('should produce structured Notion blocks', () => {
    const chunks = [
      createChunkInput({
        content: 'Block content',
        documentTitle: 'Block Doc',
        tags: ['test'],
      }),
    ];

    const result = chunksToNotionBlocks(chunks);

    expect(result[0]?.type).toBe('heading_1');
    expect(result[0]?.content).toBe('Exported Knowledge');

    expect(result[1]?.type).toBe('heading_2');
    expect(result[1]?.content).toBe('Block Doc');

    expect(result[2]?.type).toBe('paragraph');
    expect(result[2]?.content).toBe('Block content');

    expect(result[3]?.type).toBe('callout');
    expect(result[3]?.content).toContain('test');

    expect(result[4]?.type).toBe('divider');
  });

  it('should skip callout block when no tags are present', () => {
    const chunks = [
      createChunkInput({
        content: 'No tags',
        documentTitle: 'Doc',
        tags: [],
      }),
    ];

    const result = chunksToNotionBlocks(chunks);

    const callout = result.find((b) => b.type === 'callout');
    expect(callout).toBeUndefined();
  });

  it('should return only the heading for empty input', () => {
    const result = chunksToNotionBlocks([]);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('heading_1');
  });
});
