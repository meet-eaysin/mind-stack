import { Test, TestingModule } from '@nestjs/testing';
import { CleanupConceptsUseCase } from '@/modules/admin/application/cleanup-concepts.use-case';
import { PrismaService } from '@/prisma/prisma.service';

describe('CleanupConceptsUseCase', () => {
  let useCase: CleanupConceptsUseCase;

  const mockPrisma = {
    concept: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupConceptsUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<CleanupConceptsUseCase>(CleanupConceptsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete orphaned concepts', async () => {
    mockPrisma.concept.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    mockPrisma.concept.deleteMany.mockResolvedValue({ count: 2 });

    const result = await useCase.execute();

    expect(result.deletedCount).toBe(2);
    expect(mockPrisma.concept.findMany).toHaveBeenCalled();
    expect(mockPrisma.concept.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['c1', 'c2'] } },
    });
  });

  it('should return 0 if no orphaned concepts found', async () => {
    mockPrisma.concept.findMany.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result.deletedCount).toBe(0);
    expect(mockPrisma.concept.deleteMany).not.toHaveBeenCalled();
  });
});
