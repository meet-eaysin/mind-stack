import { rankResults } from '../ranking.service.js';

// ── Fixtures ──

function createRankInput(
  overrides: Partial<{
    chunkId: string;
    documentId: string;
    content: string;
    documentTitle: string;
    vectorScore: number;
    importanceScore: number | null;
    tags: string[];
    createdAt: Date;
    hasNote: boolean;
    reviewCount: number;
    queryTags: string[];
  }> = {},
): {
  chunkId: string;
  documentId: string;
  content: string;
  documentTitle: string;
  vectorScore: number;
  importanceScore: number | null;
  tags: string[];
  createdAt: Date;
  hasNote: boolean;
  reviewCount: number;
  queryTags?: string[];
} {
  return {
    chunkId: 'chunk-1',
    documentId: 'doc_1',
    content: 'content',
    documentTitle: 'Doc',
    vectorScore: 0.9,
    importanceScore: 3,
    tags: [],
    createdAt: new Date(),
    hasNote: false,
    reviewCount: 0,
    ...overrides,
  };
}

// ── Tests ──

describe('rankResults', () => {
  it('should return results sorted by final score descending', () => {
    const inputs = [
      createRankInput({ chunkId: 'low', vectorScore: 0.3 }),
      createRankInput({ chunkId: 'high', vectorScore: 0.95 }),
      createRankInput({ chunkId: 'mid', vectorScore: 0.6 }),
    ];

    const result = rankResults(inputs);

    expect(result[0]?.chunkId).toBe('high');
    expect(result[1]?.chunkId).toBe('mid');
    expect(result[2]?.chunkId).toBe('low');
  });

  it('should calculate tag match boost when queryTags are provided', () => {
    const withMatch = createRankInput({
      chunkId: 'matched',
      vectorScore: 0.5,
      tags: ['typescript', 'nestjs'],
      queryTags: ['typescript'],
    });
    const withoutMatch = createRankInput({
      chunkId: 'unmatched',
      vectorScore: 0.5,
      tags: ['python'],
      queryTags: ['typescript'],
    });

    const result = rankResults([withoutMatch, withMatch]);

    const matched = result.find((r) => r.chunkId === 'matched');
    const unmatched = result.find((r) => r.chunkId === 'unmatched');

    expect(matched).toBeDefined();
    expect(unmatched).toBeDefined();

    if (matched && unmatched) {
      expect(matched.tagMatchBoost).toBeGreaterThan(unmatched.tagMatchBoost);
      expect(matched.finalScore).toBeGreaterThan(unmatched.finalScore);
    }
  });

  it('should apply recency decay (more recent items score higher)', () => {
    const recent = createRankInput({
      chunkId: 'recent',
      vectorScore: 0.5,
      createdAt: new Date(),
    });
    const old = createRankInput({
      chunkId: 'old',
      vectorScore: 0.5,
      createdAt: new Date('2020-01-01T00:00:00Z'),
    });

    const result = rankResults([old, recent]);

    const recentResult = result.find((r) => r.chunkId === 'recent');
    const oldResult = result.find((r) => r.chunkId === 'old');

    expect(recentResult).toBeDefined();
    expect(oldResult).toBeDefined();

    if (recentResult && oldResult) {
      expect(recentResult.recencyDecay).toBeGreaterThan(oldResult.recencyDecay);
    }
  });

  it('should use default importance score of 3 when null', () => {
    const withScore = createRankInput({
      chunkId: 'with',
      vectorScore: 0.5,
      importanceScore: 3,
    });
    const withoutScore = createRankInput({
      chunkId: 'without',
      vectorScore: 0.5,
      importanceScore: null,
    });

    const resultWith = rankResults([withScore]);
    const resultWithout = rankResults([withoutScore]);

    expect(resultWith[0]?.finalScore).toBeCloseTo(
      resultWithout[0]?.finalScore ?? 0,
      5,
    );
  });

  it('should return an empty array when given no inputs', () => {
    const result = rankResults([]);

    expect(result).toEqual([]);
  });
});
