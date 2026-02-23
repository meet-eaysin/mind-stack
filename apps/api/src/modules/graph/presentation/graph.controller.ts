import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import type { GraphResponse } from '@repo/shared-types';
import { BuildGraphUseCase } from '../application/build-graph.use-case';
import { QueryGraphUseCase } from '../application/query-graph.use-case';
import { GetNeighborhoodUseCase } from '../application/get-neighborhood.use-case';
import { CreateRelationUseCase } from '../application/create-relation.use-case';
import { DeleteRelationUseCase } from '../application/delete-relation.use-case';
import {
  ConceptNeighborhoodDto,
  BuildGraphDto,
  CreateRelationDto,
} from './graph.dtos';
import { getUserIdFromHeader } from '../../../common/request-user';

@Controller('graph')
export class GraphController {
  constructor(
    private readonly buildGraph: BuildGraphUseCase,
    private readonly queryGraph: QueryGraphUseCase,
    private readonly getNeighborhood: GetNeighborhoodUseCase,
    private readonly createRelation: CreateRelationUseCase,
    private readonly deleteRelation: DeleteRelationUseCase,
  ) {}

  @Get()
  async getGraph(
    @Headers('x-user-id') userId?: string,
  ): Promise<GraphResponse> {
    return this.queryGraph.execute({ userId: getUserIdFromHeader(userId) });
  }

  @Post('build')
  async build(
    @Body() dto: BuildGraphDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ success: boolean }> {
    await this.buildGraph.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    return { success: true };
  }

  @Post('neighborhood')
  async neighborhood(
    @Body() dto: ConceptNeighborhoodDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<GraphResponse> {
    return this.getNeighborhood.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
  }

  @Post('relations')
  async addRelation(
    @Body() dto: CreateRelationDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ success: boolean }> {
    await this.createRelation.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    return { success: true };
  }

  @Delete('relations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRelation(@Param('id') id: string): Promise<void> {
    await this.deleteRelation.execute(id);
  }
}
