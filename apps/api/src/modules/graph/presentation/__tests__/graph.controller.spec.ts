import { Test, type TestingModule } from '@nestjs/testing';
import { GraphController } from '../graph.controller.js';
import { BuildGraphUseCase } from '../../application/build-graph.use-case.js';
import { QueryGraphUseCase } from '../../application/query-graph.use-case.js';
import { GetNeighborhoodUseCase } from '../../application/get-neighborhood.use-case.js';
import { CreateRelationUseCase } from '../../application/create-relation.use-case.js';
import { DeleteRelationUseCase } from '../../application/delete-relation.use-case.js';

describe('GraphController', () => {
  let controller: GraphController;

  const mockBuildGraph = { execute: jest.fn() };
  const mockQueryGraph = { execute: jest.fn() };
  const mockGetNeighborhood = { execute: jest.fn() };
  const mockCreateRelation = { execute: jest.fn() };
  const mockDeleteRelation = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GraphController],
      providers: [
        { provide: BuildGraphUseCase, useValue: mockBuildGraph },
        { provide: QueryGraphUseCase, useValue: mockQueryGraph },
        { provide: GetNeighborhoodUseCase, useValue: mockGetNeighborhood },
        { provide: CreateRelationUseCase, useValue: mockCreateRelation },
        { provide: DeleteRelationUseCase, useValue: mockDeleteRelation },
      ],
    }).compile();

    controller = moduleFixture.get(GraphController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns graph and neighborhood', async () => {
    mockQueryGraph.execute.mockResolvedValue({ nodes: [], edges: [] });
    mockGetNeighborhood.execute.mockResolvedValue({
      nodes: [{ id: 'c1' }],
      edges: [],
    });

    await expect(controller.getGraph()).resolves.toEqual({
      nodes: [],
      edges: [],
    });
    await expect(
      controller.neighborhood({ conceptId: 'c1', depth: 2 }),
    ).resolves.toEqual({ nodes: [{ id: 'c1' }], edges: [] });
  });

  it('builds graph and manages relations', async () => {
    mockBuildGraph.execute.mockResolvedValue(undefined);
    mockCreateRelation.execute.mockResolvedValue(undefined);
    mockDeleteRelation.execute.mockResolvedValue(undefined);

    await expect(controller.build({ forceRebuild: true })).resolves.toEqual({
      success: true,
    });

    await expect(
      controller.addRelation({ fromId: 'a', toId: 'b', type: 'IS_PART_OF' }),
    ).resolves.toEqual({ slug: 'ok' });

    await expect(controller.removeRelation('rel-1')).resolves.toBeUndefined();
  });
});
