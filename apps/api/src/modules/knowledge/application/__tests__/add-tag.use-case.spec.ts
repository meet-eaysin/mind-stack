import { AddTagUseCase } from '../add-tag.use-case.js';
import type { TagRepository } from '../../domain/tag-repository.interface.js';
import type { TagEntity } from '../../domain/tag.entity.js';

// ── Fakes ──

class FakeTagRepository implements TagRepository {
  private readonly tags: Map<string, TagEntity> = new Map();
  private readonly documentTags: Map<string, Set<string>> = new Map();
  private idCounter = 0;

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

  getDocumentTagIds(documentId: string): Set<string> {
    return this.documentTags.get(documentId) ?? new Set<string>();
  }
}

// ── Tests ──

describe('AddTagUseCase', () => {
  let useCase: AddTagUseCase;
  let tagRepository: FakeTagRepository;

  beforeEach(() => {
    tagRepository = new FakeTagRepository();
    useCase = new AddTagUseCase(tagRepository);
  });

  it('should create a tag and link it to the document', async () => {
    await useCase.execute({ documentId: 'doc-1', tagName: 'important' });

    const tags = await tagRepository.findByDocumentId('doc-1');
    expect(tags).toHaveLength(1);
    expect(tags[0]?.name).toBe('important');
  });

  it('should reuse an existing tag instead of creating a duplicate', async () => {
    await useCase.execute({ documentId: 'doc-1', tagName: 'important' });
    await useCase.execute({ documentId: 'doc-2', tagName: 'important' });

    const tags1 = await tagRepository.findByDocumentId('doc-1');
    const tags2 = await tagRepository.findByDocumentId('doc-2');

    expect(tags1[0]?.id).toBe(tags2[0]?.id);
  });
});
