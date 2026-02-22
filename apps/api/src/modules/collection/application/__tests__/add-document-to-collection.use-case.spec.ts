import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddDocumentToCollectionUseCase } from '../add-document-to-collection.use-case.js';
import { PrismaCollectionRepository } from '../../infrastructure/prisma-collection.repository.js';
import { PrismaDocumentRepository } from '../../../ingestion/infrastructure/prisma-document.repository.js';

describe('AddDocumentToCollectionUseCase', () => {
  let useCase: AddDocumentToCollectionUseCase;

  const mockCollectionRepository = {
    findById: jest.fn(),
    findItemByCollectionAndDocument: jest.fn(),
    findWithItems: jest.fn(),
    addItem: jest.fn(),
  };

  const mockDocumentRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AddDocumentToCollectionUseCase,
          useFactory: (
            cRepo: PrismaCollectionRepository,
            dRepo: PrismaDocumentRepository,
          ) => new AddDocumentToCollectionUseCase(cRepo, dRepo),
          inject: [PrismaCollectionRepository, PrismaDocumentRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockCollectionRepository,
        },
        {
          provide: PrismaDocumentRepository,
          useValue: mockDocumentRepository,
        },
      ],
    }).compile();

    useCase = module.get<AddDocumentToCollectionUseCase>(
      AddDocumentToCollectionUseCase,
    );
    // Removed unused assignments:
    // collectionRepository = module.get<PrismaCollectionRepository>(
    //   PrismaCollectionRepository,
    // );
    // documentRepository = module.get<PrismaDocumentRepository>(
    //   PrismaDocumentRepository,
    // );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a document to a collection', async () => {
    mockCollectionRepository.findById.mockResolvedValue({ id: '1' });
    mockDocumentRepository.findById.mockResolvedValue({ id: 'doc1' });
    mockCollectionRepository.findItemByCollectionAndDocument.mockResolvedValue(
      null,
    );
    mockCollectionRepository.findWithItems.mockResolvedValue({
      id: '1',
      items: [],
    });
    mockCollectionRepository.addItem.mockResolvedValue({ id: 'item1' }); // Kept this line as the expect statement relies on it.

    await useCase.execute({ collectionId: '1', documentId: 'doc1' });

    expect(mockCollectionRepository.addItem).toHaveBeenCalled();
  });

  it('should throw NotFoundException if collection not found', async () => {
    mockCollectionRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ collectionId: 'invalid', documentId: 'doc1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if document not found', async () => {
    mockCollectionRepository.findById.mockResolvedValue({ id: '1' });
    mockDocumentRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ collectionId: '1', documentId: 'invalid' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if document already in collection', async () => {
    mockCollectionRepository.findById.mockResolvedValue({ id: '1' });
    mockDocumentRepository.findById.mockResolvedValue({ id: 'doc1' }); // Added this line back for completeness, as document must exist to be in collection.
    mockCollectionRepository.findItemByCollectionAndDocument.mockResolvedValue({
      id: 'item1',
    });

    await expect(
      useCase.execute({ collectionId: '1', documentId: 'doc1' }),
    ).rejects.toThrow(BadRequestException);
  });
});
