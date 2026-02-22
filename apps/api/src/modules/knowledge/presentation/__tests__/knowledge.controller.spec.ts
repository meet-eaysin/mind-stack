import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { KnowledgeController } from '../knowledge.controller.js';
import { ListDocumentsUseCase } from '../../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../../application/view-document.use-case.js';
import { DeleteDocumentUseCase } from '../../application/delete-document.use-case.js';
import { AddTagUseCase } from '../../application/add-tag.use-case.js';
import { RemoveTagUseCase } from '../../application/remove-tag.use-case.js';
import { AddNoteUseCase } from '../../application/add-note.use-case.js';
import { UpdateNoteUseCase } from '../../application/update-note.use-case.js';
import { UpdateImportanceUseCase } from '../../application/update-importance.use-case.js';
import { UpdateDocumentUseCase } from '../../application/update-document.use-case.js';
import { ConfigService } from '@nestjs/config';

describe('KnowledgeController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockListDocuments = { execute: jest.fn() };
  const mockViewDocument = { execute: jest.fn() };
  const mockDeleteDocument = { execute: jest.fn() };
  const mockAddTag = { execute: jest.fn() };
  const mockRemoveTag = { execute: jest.fn() };
  const mockAddNote = { execute: jest.fn() };
  const mockUpdateNote = { execute: jest.fn() };
  const mockUpdateImportance = { execute: jest.fn() };
  const mockUpdateDocument = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(null) };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeController],
      providers: [
        { provide: ListDocumentsUseCase, useValue: mockListDocuments },
        { provide: ViewDocumentUseCase, useValue: mockViewDocument },
        { provide: DeleteDocumentUseCase, useValue: mockDeleteDocument },
        { provide: AddTagUseCase, useValue: mockAddTag },
        { provide: RemoveTagUseCase, useValue: mockRemoveTag },
        { provide: AddNoteUseCase, useValue: mockAddNote },
        { provide: UpdateNoteUseCase, useValue: mockUpdateNote },
        { provide: UpdateImportanceUseCase, useValue: mockUpdateImportance },
        { provide: UpdateDocumentUseCase, useValue: mockUpdateDocument },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /knowledge/documents', () => {
    it('should return 200 with paginated documents', async () => {
      mockListDocuments.execute.mockResolvedValue({
        documents: [
          {
            id: '1',
            title: 'Doc 1',
            sourceType: 'URL',
            sourceUrl: 'https://example.com',
            status: 'READY',
            learningStatus: 'UPCOMING',
            type: 'ARTICLE',
            author: 'Author',
            publisher: 'Publisher',
            publishedAt: new Date(),
            language: 'en',
            addedByUserAt: new Date(),
            createdAt: new Date(),
            chunkCount: 5,
          },
        ],
        total: 1,
      });
      const response = await request(app.getHttpServer())
        .get('/knowledge/documents')
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.documents).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });

    it('should return 400 for invalid page size', async () => {
      const response = await request(app.getHttpServer())
        .get('/knowledge/documents')
        .query({ pageSize: 1000 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /knowledge/documents/:id', () => {
    it('should return 200 with document details', async () => {
      mockViewDocument.execute.mockResolvedValue({
        id: 'doc-1',
        title: 'Test',
        sourceType: 'URL',
        sourceUrl: 'https://example.com',
        status: 'READY',
        learningStatus: 'UPCOMING',
        type: 'ARTICLE',
        author: 'Author',
        publisher: 'Publisher',
        publishedAt: new Date().toISOString(),
        language: 'en',
        rawContent: 'Content',
        chunks: [],
        tags: [],
        importance: 3,
        createdAt: new Date().toISOString(),
      });
      const response = await request(app.getHttpServer()).get(
        '/knowledge/documents/doc-1',
      );

      expect(response.status).toBe(200);
      expect(response.body.document).toBeDefined();
    });
  });

  describe('POST /knowledge/tags', () => {
    it('should return 201 for valid tag addition', async () => {
      mockAddTag.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .post('/knowledge/tags')
        .send({ documentId: 'd1', tagName: 'important' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /knowledge/tags', () => {
    it('should return 200 (Mocked DELETE as POST for simplicity if needed, but here it is DELETE)', async () => {
      mockRemoveTag.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .delete('/knowledge/tags')
        .send({ documentId: 'd1', tagName: 'important' });

      expect(response.status).toBe(200); // DELETE usually returns 200 or 204
    });
  });

  describe('POST /knowledge/notes', () => {
    it('should return 201 when adding a note', async () => {
      mockAddNote.execute.mockResolvedValue({ id: 'n1' });
      const response = await request(app.getHttpServer())
        .post('/knowledge/notes')
        .send({ documentId: 'd1', content: 'Some note' });

      expect(response.status).toBe(201);
      expect(response.body.noteId).toBe('n1');
    });
  });

  describe('PUT /knowledge/notes/:id', () => {
    it('should return 200 when updating a note', async () => {
      mockUpdateNote.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .put('/knowledge/notes/n1')
        .send({ content: 'Updated note' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /knowledge/importance', () => {
    it('should return 201 for valid importance update', async () => {
      mockUpdateImportance.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .post('/knowledge/importance')
        .send({ documentId: 'd1', score: 5 });

      expect(response.status).toBe(201);
    });

    it('should return 400 for out of range score', async () => {
      const response = await request(app.getHttpServer())
        .post('/knowledge/importance')
        .send({ documentId: 'd1', score: 10 });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /knowledge/documents/:id', () => {
    it('should return 200 when updating a document', async () => {
      mockUpdateDocument.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .patch('/knowledge/documents/doc-1')
        .send({ title: 'New Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
