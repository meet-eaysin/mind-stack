import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CollectionController } from '../collection.controller.js';
import { CreateCollectionUseCase } from '../../application/create-collection.use-case.js';
import { ListCollectionsUseCase } from '../../application/list-collections.use-case.js';
import { GetCollectionUseCase } from '../../application/get-collection.use-case.js';
import { UpdateCollectionUseCase } from '../../application/update-collection.use-case.js';
import { DeleteCollectionUseCase } from '../../application/delete-collection.use-case.js';
import { AddDocumentToCollectionUseCase } from '../../application/add-document-to-collection.use-case.js';
import { RemoveDocumentFromCollectionUseCase } from '../../application/remove-document-from-collection.use-case.js';
import { ReorderCollectionItemsUseCase } from '../../application/reorder-collection-items.use-case.js';

describe('CollectionController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockCreateCollection = { execute: jest.fn() };
  const mockListCollections = { execute: jest.fn() };
  const mockGetCollection = { execute: jest.fn() };
  const mockUpdateCollection = { execute: jest.fn() };
  const mockDeleteCollection = { execute: jest.fn() };
  const mockAddDocument = { execute: jest.fn() };
  const mockRemoveDocument = { execute: jest.fn() };
  const mockReorderItems = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CollectionController],
      providers: [
        { provide: CreateCollectionUseCase, useValue: mockCreateCollection },
        { provide: ListCollectionsUseCase, useValue: mockListCollections },
        { provide: GetCollectionUseCase, useValue: mockGetCollection },
        { provide: UpdateCollectionUseCase, useValue: mockUpdateCollection },
        { provide: DeleteCollectionUseCase, useValue: mockDeleteCollection },
        { provide: AddDocumentToCollectionUseCase, useValue: mockAddDocument },
        {
          provide: RemoveDocumentFromCollectionUseCase,
          useValue: mockRemoveDocument,
        },
        { provide: ReorderCollectionItemsUseCase, useValue: mockReorderItems },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('POST /collections', () => {
    it('should create a collection', async () => {
      const dto = { name: 'New Collection' };
      mockCreateCollection.execute.mockResolvedValue({ id: '1', ...dto });

      const response = await request(app.getHttpServer())
        .post('/collections')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('1');
    });
  });

  describe('GET /collections', () => {
    it('should list collections', async () => {
      mockListCollections.execute.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/collections');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /collections/:id', () => {
    it('should get a collection', async () => {
      mockGetCollection.execute.mockResolvedValue({ id: '1', name: 'Col 1' });

      const response = await request(app.getHttpServer()).get('/collections/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('1');
    });
  });

  describe('POST /collections/:id/items', () => {
    it('should add item to collection', async () => {
      const collectionId = '550e8400-e29b-41d4-a716-446655440000';
      const documentId = '550e8400-e29b-41d4-a716-446655440001';
      mockAddDocument.execute.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/collections/${collectionId}/items`)
        .send({ documentId });

      expect(response.status).toBe(201);
      expect(mockAddDocument.execute).toHaveBeenCalledWith({
        collectionId,
        documentId,
      });
    });
  });
});
