import { groupChunksToDocuments } from '../group-chunks.util.js';

describe('groupChunksToDocuments', () => {
  it('returns aggregated document results without chunk payloads', () => {
    const result = groupChunksToDocuments([
      {
        chunkId: 'c1',
        documentId: 'd1',
        content: 'alpha',
        documentTitle: 'Doc 1',
        score: 0.4,
        tags: ['a'],
        hasNote: false,
      },
      {
        chunkId: 'c2',
        documentId: 'd1',
        content: 'beta',
        documentTitle: 'Doc 1',
        score: 0.9,
        tags: ['a'],
        hasNote: false,
      },
    ]);

    expect(result).toEqual([
      {
        documentId: 'd1',
        title: 'Doc 1',
        author: undefined,
        publishedAt: undefined,
        sourceUrl: null,
        score: 0.9,
        tags: ['a'],
        hasNote: false,
      },
    ]);
  });
});
