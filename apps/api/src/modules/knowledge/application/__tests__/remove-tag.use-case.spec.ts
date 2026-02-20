import { RemoveTagUseCase } from '../remove-tag.use-case.js';
import type { TagRepository } from '../../domain/tag-repository.interface.js';
import type { TagEntity } from '../../domain/tag.entity.js';

// ── Fakes ──

class FakeTagRepository implements TagRepository {
  private readonly tags: Map<string, TagEntity> = new Map();
  private readonly documentTags: Map<string, Set<string>> = new Map();
  private idCounter = 0;

  seed(documentId: string, tag: TagEntity): void {
    this.tags.set(tag.id, tag);
    const existing = this.documentTags.get(documentId) ?? new Set<string>();
    existing.add(tag.id);
    this.documentTags.set(documentId, existing);
  }

  findOrCreate(name: string): Promise<TagEntity> {
    for (const tag of this.tags.values()) {
      if (tag.name === name) return Promise.resolve(tag);
    }
    this.idCounter += 1;
    const tag: TagEntity = { id: `tag-${String(this.idCounter)}`, name };
    this.tags.set(tag.id, tag);
    return Promise.resolve(tag);
  }

  addTagToDocument(documentId: string, tagId: string): Promise<void> {
    const existing = this.documentTags.get(documentId) ?? new Set<string>();
    existing.add(tagId);
    this.documentTags.set(documentId, existing);
    return Promise.resolve();
  }

  removeTagFromDocument(documentId: string, tagName: string): Promise<void> {
    const existing = this.documentTags.get(documentId);
    if (!existing) return Promise.resolve();
    for (const [id, tag] of this.tags) {
      if (tag.name === tagName) {
        existing.delete(id);
        break;
      }
    }
    return Promise.resolve();
  }

  findByDocumentId(documentId: string): Promise<TagEntity[]> {
    const tagIds = this.documentTags.get(documentId);
    if (!tagIds) return Promise.resolve([]);
    const result: TagEntity[] = [];
    for (const tagId of tagIds) {
      const tag = this.tags.get(tagId);
      if (tag) result.push(tag);
    }
    return Promise.resolve(result);
  }
}

// ── Tests ──

describe('RemoveTagUseCase', () => {
  let useCase: RemoveTagUseCase;
  let tagRepository: FakeTagRepository;

  beforeEach(() => {
    tagRepository = new FakeTagRepository();
    useCase = new RemoveTagUseCase(tagRepository);
  });

  it('should remove the tag from the document', async () => {
    tagRepository.seed('doc-1', { id: 'tag-1', name: 'important' });

    await useCase.execute({ documentId: 'doc-1', tagName: 'important' });

    const tags = await tagRepository.findByDocumentId('doc-1');
    expect(tags).toHaveLength(0);
  });

  it('should not throw when removing a tag that does not exist', async () => {
    await expect(
      useCase.execute({ documentId: 'doc-1', tagName: 'nonexistent' }),
    ).resolves.toBeUndefined();
  });
});
