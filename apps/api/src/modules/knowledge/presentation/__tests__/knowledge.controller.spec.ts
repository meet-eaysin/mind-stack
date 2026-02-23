import { Test, type TestingModule } from '@nestjs/testing';
import { KnowledgeController } from '../knowledge.controller.js';
import { ListDocumentsUseCase } from '../../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../../application/view-document.use-case.js';
import { DeleteDocumentUseCase } from '../../application/delete-document.use-case.js';
import { GetRelatedSuggestionsUseCase } from '../../application/get-related-suggestions.use-case.js';
import { AddTagUseCase } from '../../application/add-tag.use-case.js';
import { RemoveTagUseCase } from '../../application/remove-tag.use-case.js';
import { AddNoteUseCase } from '../../application/add-note.use-case.js';
import { UpdateNoteUseCase } from '../../application/update-note.use-case.js';
import { UpdateImportanceUseCase } from '../../application/update-importance.use-case.js';
import { UpdateDocumentUseCase } from '../../application/update-document.use-case.js';

describe('KnowledgeController', () => {
  let controller: KnowledgeController;

  const mockListDocuments = { execute: jest.fn() };
  const mockViewDocument = { execute: jest.fn() };
  const mockDeleteDocument = { execute: jest.fn() };
  const mockGetRelatedSuggestions = { execute: jest.fn() };
  const mockAddTag = { execute: jest.fn() };
  const mockRemoveTag = { execute: jest.fn() };
  const mockAddNote = { execute: jest.fn() };
  const mockUpdateNote = { execute: jest.fn() };
  const mockUpdateImportance = { execute: jest.fn() };
  const mockUpdateDocument = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeController],
      providers: [
        { provide: ListDocumentsUseCase, useValue: mockListDocuments },
        { provide: ViewDocumentUseCase, useValue: mockViewDocument },
        { provide: DeleteDocumentUseCase, useValue: mockDeleteDocument },
        {
          provide: GetRelatedSuggestionsUseCase,
          useValue: mockGetRelatedSuggestions,
        },
        { provide: AddTagUseCase, useValue: mockAddTag },
        { provide: RemoveTagUseCase, useValue: mockRemoveTag },
        { provide: AddNoteUseCase, useValue: mockAddNote },
        { provide: UpdateNoteUseCase, useValue: mockUpdateNote },
        { provide: UpdateImportanceUseCase, useValue: mockUpdateImportance },
        { provide: UpdateDocumentUseCase, useValue: mockUpdateDocument },
      ],
    }).compile();

    controller = moduleFixture.get(KnowledgeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists documents', async () => {
    const now = new Date('2026-02-23T00:00:00.000Z');
    mockListDocuments.execute.mockResolvedValue({
      documents: [
        {
          id: 'd1',
          title: 'Doc 1',
          sourceType: 'URL',
          sourceUrl: 'https://example.com',
          status: 'READY',
          learningStatus: 'UPCOMING',
          type: 'ARTICLE',
          author: null,
          publisher: null,
          publishedAt: null,
          language: 'en',
          addedByUserAt: now,
          createdAt: now,
          chunkCount: 3,
        },
      ],
      total: 1,
    });

    const result = await controller.list({ page: 1, pageSize: 10 });
    expect(result.total).toBe(1);
    expect(result.documents[0]?.id).toBe('d1');
  });

  it('returns detail/status/notes/related for a document', async () => {
    const now = new Date('2026-02-23T00:00:00.000Z');
    mockViewDocument.execute.mockResolvedValue({
      document: {
        id: 'd1',
        title: 'Doc 1',
        sourceType: 'URL',
        sourceUrl: 'https://example.com',
        rawContent: 'raw',
        status: 'READY',
        learningStatus: 'UPCOMING',
        type: 'ARTICLE',
        author: null,
        publisher: null,
        publishedAt: null,
        language: 'en',
        addedByUserAt: now,
        createdAt: now,
      },
      chunks: [
        {
          id: 'c1',
          documentId: 'd1',
          content: 'chunk',
          startOffset: 0,
          endOffset: 5,
          createdAt: now,
        },
      ],
      tags: [{ id: 't1', name: 'tag' }],
      notes: [
        {
          id: 'n1',
          documentId: 'd1',
          chunkId: null,
          type: 'NOTE',
          content: 'note',
          selectedText: null,
          metadata: null,
          createdAt: now,
        },
      ],
      importanceScore: 3,
    });
    mockGetRelatedSuggestions.execute.mockResolvedValue([]);

    const details = await controller.details('d1');
    expect(details.id).toBe('d1');
    expect(details.notes).toHaveLength(1);

    await expect(controller.getStatus('d1')).resolves.toEqual({ status: 'READY' });
    await expect(controller.getNotes('d1')).resolves.toHaveLength(1);
    await expect(controller.getRelated('d1')).resolves.toEqual([]);
  });

  it('updates, tags, annotates, scores, and deletes', async () => {
    const now = new Date('2026-02-23T00:00:00.000Z');
    mockUpdateDocument.execute.mockResolvedValue(undefined);
    mockAddTag.execute.mockResolvedValue(undefined);
    mockRemoveTag.execute.mockResolvedValue(undefined);
    mockAddNote.execute.mockResolvedValue({
      id: 'n1',
      documentId: 'd1',
      chunkId: null,
      type: 'NOTE',
      content: 'note',
      selectedText: null,
      metadata: null,
      createdAt: now,
    });
    mockUpdateNote.execute.mockResolvedValue({
      id: 'n1',
      documentId: 'd1',
      chunkId: null,
      type: 'NOTE',
      content: 'updated',
      selectedText: null,
      metadata: null,
      createdAt: now,
    });
    mockUpdateImportance.execute.mockResolvedValue(undefined);
    mockDeleteDocument.execute.mockResolvedValue(undefined);

    await expect(controller.update('d1', { title: 'Updated' })).resolves.toEqual({
      success: true,
    });
    await expect(
      controller.addTagToDocument({ documentId: 'd1', tagName: 'tag' }),
    ).resolves.toEqual({ success: true });
    await expect(
      controller.removeTagFromDocument({ documentId: 'd1', tagName: 'tag' }),
    ).resolves.toEqual({ success: true });

    await expect(
      controller.createNote({ documentId: 'd1', content: 'note' }),
    ).resolves.toMatchObject({ id: 'n1' });
    await expect(
      controller.updateExistingNote('n1', { content: 'updated' }),
    ).resolves.toMatchObject({ content: 'updated' });

    await expect(
      controller.updateDocumentImportance({ documentId: 'd1', score: 5 }),
    ).resolves.toEqual({ success: true });
    await expect(controller.delete('d1')).resolves.toEqual({ success: true });
  });
});
