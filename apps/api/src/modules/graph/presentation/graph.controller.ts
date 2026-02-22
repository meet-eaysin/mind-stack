import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { GraphResponse } from '@repo/shared-types';
import { BuildGraphUseCase } from '../application/build-graph.use-case.js';
import { QueryGraphUseCase } from '../application/query-graph.use-case.js';
import { GetNeighborhoodUseCase } from '../application/get-neighborhood.use-case.js';
import { CreateRelationUseCase } from '../application/create-relation.use-case.js';
import { DeleteRelationUseCase } from '../application/delete-relation.use-case.js';
import {
  ConceptNeighborhoodDto,
  BuildGraphDto,
  CreateRelationDto,
} from './graph.dtos.js';

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
  async getGraph(): Promise<GraphResponse> {
    return this.queryGraph.execute();
  }

  @Post('build')
  async build(@Body() dto: BuildGraphDto): Promise<{ success: boolean }> {
    await this.buildGraph.execute(dto);
    return { success: true };
  }

  @Post('neighborhood')
  async neighborhood(
    @Body() dto: ConceptNeighborhoodDto,
  ): Promise<GraphResponse> {
    return this.getNeighborhood.execute(dto);
  }

  @Post('relations')
  async addRelation(@Body() dto: CreateRelationDto): Promise<{ slug: string }> {
    await this.createRelation.execute(dto);
    return { slug: 'ok' };
  }

  @Delete('relations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRelation(@Param('id') id: string): Promise<void> {
    await this.deleteRelation.execute(id);
  }
}
