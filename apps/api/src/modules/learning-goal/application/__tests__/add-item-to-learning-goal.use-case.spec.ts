import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddItemToLearningGoalUseCase } from '../add-item-to-learning-goal.use-case.js';
import { PrismaLearningGoalRepository } from '../../infrastructure/prisma-learning-goal.repository.js';
import { PrismaCollectionRepository } from '../../../collection/infrastructure/prisma-collection.repository.js';
import { PrismaDocumentRepository } from '../../../ingestion/infrastructure/prisma-document.repository.js';

describe('AddItemToLearningGoalUseCase', () => {
  let useCase: AddItemToLearningGoalUseCase;

  const mockGoalRepo = {
    findById: jest.fn(),
    findItemByGoalAndCollection: jest.fn(),
    findItemByGoalAndDocument: jest.fn(),
    addItem: jest.fn(),
  };

  const mockCollectionRepo = {
    findById: jest.fn(),
  };

  const mockDocumentRepo = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AddItemToLearningGoalUseCase,
          useFactory: (
            gRepo: PrismaLearningGoalRepository,
            cRepo: PrismaCollectionRepository,
            dRepo: PrismaDocumentRepository,
          ) => new AddItemToLearningGoalUseCase(gRepo, cRepo, dRepo),
          inject: [
            PrismaLearningGoalRepository,
            PrismaCollectionRepository,
            PrismaDocumentRepository,
          ],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockGoalRepo,
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockCollectionRepo,
        },
        {
          provide: PrismaDocumentRepository,
          useValue: mockDocumentRepo,
        },
      ],
    }).compile();

    useCase = module.get<AddItemToLearningGoalUseCase>(
      AddItemToLearningGoalUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a collection to a goal', async () => {
    mockGoalRepo.findById.mockResolvedValue({ id: 'g1' });
    mockCollectionRepo.findById.mockResolvedValue({ id: 'c1' });
    mockGoalRepo.findItemByGoalAndCollection.mockResolvedValue(null);
    mockGoalRepo.addItem.mockResolvedValue({ id: 'item1' });

    await useCase.execute({ goalId: 'g1', collectionId: 'c1' });

    expect(mockGoalRepo.addItem).toHaveBeenCalled();
  });

  it('should add a document to a goal', async () => {
    mockGoalRepo.findById.mockResolvedValue({ id: 'g1' });
    mockDocumentRepo.findById.mockResolvedValue({ id: 'd1' });
    mockGoalRepo.findItemByGoalAndDocument.mockResolvedValue(null);
    mockGoalRepo.addItem.mockResolvedValue({ id: 'item1' });

    await useCase.execute({ goalId: 'g1', documentId: 'd1' });

    expect(mockGoalRepo.addItem).toHaveBeenCalled();
  });

  it('should throw BadRequestException if neither id is provided', async () => {
    await expect(useCase.execute({ goalId: 'g1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException if goal missing', async () => {
    mockGoalRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ goalId: 'g1', documentId: 'd1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
