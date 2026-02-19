import { Controller, Post, Body } from '@nestjs/common';
import type { SearchResponse, AskQuestionResponse } from '@repo/shared-types';
import { SemanticSearchUseCase } from '../application/semantic-search.use-case.js';
import { FilteredSearchUseCase } from '../application/filtered-search.use-case.js';
import { AskQuestionUseCase } from '../application/ask-question.use-case.js';
import { RetrieveChunksUseCase } from '../application/retrieve-chunks.use-case.js';
import {
  SemanticSearchDto,
  FilteredSearchDto,
  AskQuestionDto,
} from './query.dtos.js';

@Controller('query')
export class QueryController {
  constructor(
    private readonly semanticSearch: SemanticSearchUseCase,
    private readonly filteredSearch: FilteredSearchUseCase,
    private readonly askQuestion: AskQuestionUseCase,
    private readonly retrieveChunks: RetrieveChunksUseCase,
  ) {}

  @Post('search')
  async search(@Body() dto: SemanticSearchDto): Promise<SearchResponse> {
    const chunks = await this.semanticSearch.execute(dto);
    return { chunks };
  }

  @Post('search/filtered')
  async searchFiltered(
    @Body() dto: FilteredSearchDto,
  ): Promise<SearchResponse> {
    const chunks = await this.filteredSearch.execute(dto);
    return { chunks };
  }

  @Post('ask')
  async ask(@Body() dto: AskQuestionDto): Promise<AskQuestionResponse> {
    return this.askQuestion.execute(dto);
  }

  @Post('retrieve')
  async retrieve(@Body() dto: SemanticSearchDto): Promise<SearchResponse> {
    const chunks = await this.retrieveChunks.execute(dto);
    return { chunks };
  }
}
