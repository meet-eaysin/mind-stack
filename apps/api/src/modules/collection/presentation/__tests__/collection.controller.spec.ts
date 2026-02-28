import { Test, type TestingModule } from '@nestjs/testing';
import { CollectionController } from '@/modules/collection/presentation/collection.controller';
import { CreateCollectionUseCase } from '@/modules/collection/application/create-collection.use-case';
import { ListCollectionsUseCase } from '@/modules/collection/application/list-collections.use-case';
import { GetCollectionUseCase } from '@/modules/collection/application/get-collection.use-case';
import { UpdateCollectionUseCase } from '@/modules/collection/application/update-collection.use-case';
import { DeleteCollectionUseCase } from '@/modules/collection/application/delete-collection.use-case';
import { AddDocumentToCollectionUseCase } from '@/modules/collection/application/add-document-to-collection.use-case';
import { RemoveDocumentFromCollectionUseCase } from '@/modules/collection/application/remove-document-from-collection.use-case';
import { ReorderCollectionItemsUseCase } from '@/modules/collection/application/reorder-collection-items.use-case';

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
