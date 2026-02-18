import { Controller, Get, Post, Body } from "@nestjs/common";
import type { GraphResponse } from "@repo/shared-types";
import { BuildGraphUseCase } from "../application/build-graph.use-case.js";
import { QueryGraphUseCase } from "../application/query-graph.use-case.js";
import { GetNeighborhoodUseCase } from "../application/get-neighborhood.use-case.js";
import { ConceptNeighborhoodDto, BuildGraphDto } from "./graph.dtos.js";

@Controller("graph")
export class GraphController {
  constructor(
    private readonly buildGraph: BuildGraphUseCase,
    private readonly queryGraph: QueryGraphUseCase,
    private readonly getNeighborhood: GetNeighborhoodUseCase
  ) {}

  @Get()
  async getGraph(): Promise<GraphResponse> {
    return this.queryGraph.execute();
  }

  @Post("build")
  async build(@Body() dto: BuildGraphDto): Promise<{ success: boolean }> {
    await this.buildGraph.execute(dto);
    return { success: true };
  }

  @Post("neighborhood")
  async neighborhood(
    @Body() dto: ConceptNeighborhoodDto
  ): Promise<GraphResponse> {
    return this.getNeighborhood.execute(dto);
  }
}
