import { Test, type TestingModule } from '@nestjs/testing';
import { CollectionController } from '../collection.controller.js';
import { CreateCollectionUseCase } from '../../application/create-collection.use-case.js';
import { ListCollectionsUseCase } from '../../application/list-collections.use-case.js';
import { GetCollectionUseCase } from '../../application/get-collection.use-case.js';
import { UpdateCollectionUseCase } from '../../application/update-collection.use-case.js';
import { DeleteCollectionUseCase } from '../../application/delete-collection.use-case.js';
import { AddDocumentToCollectionUseCase } from '../../application/add-document-to-collection.use-case.js';
import { RemoveDocumentFromCollectionUseCase } from '../../application/remove-document-from-collection.use-case.js';
import { ReorderCollectionItemsUseCase } from '../../application/reorder-collection-items.use-case.js';

describe('CollectionController', () => {
  let controller: CollectionController;

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

    controller = moduleFixture.get(CollectionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates and lists collections', async () => {
    const created = { id: '1', name: 'New Collection' };
    mockCreateCollection.execute.mockResolvedValue(created);
    mockListCollections.execute.mockResolvedValue([created]);

    await expect(
      controller.create({ name: 'New Collection' }),
    ).resolves.toEqual(created);
    await expect(controller.list()).resolves.toEqual([created]);
  });

  it('adds, removes and reorders items', async () => {
    mockAddDocument.execute.mockResolvedValue(undefined);
    mockRemoveDocument.execute.mockResolvedValue(undefined);
    mockReorderItems.execute.mockResolvedValue(undefined);

    await controller.addItem('col-1', { documentId: 'doc-1' });
    await controller.removeItem('col-1', 'doc-1');
    await controller.reorder('col-1', { itemIds: ['a', 'b'] });

    expect(mockAddDocument.execute).toHaveBeenCalledWith({
      collectionId: 'col-1',
      documentId: 'doc-1',
    });
    expect(mockRemoveDocument.execute).toHaveBeenCalledWith('col-1', 'doc-1');
    expect(mockReorderItems.execute).toHaveBeenCalledWith('col-1', ['a', 'b']);
  });
});
