import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  SearchResponse,
  AskQuestionResponse,
  ChunkReference,
} from '@repo/shared-types';
import { SemanticSearchUseCase } from '../application/semantic-search.use-case.js';
import { FilteredSearchUseCase } from '../application/filtered-search.use-case.js';
import { AskQuestionUseCase } from '../application/ask-question.use-case.js';
import { RetrieveChunksUseCase } from '../application/retrieve-chunks.use-case.js';
import {
  SemanticSearchDto,
  FilteredSearchDto,
  AskQuestionDto,
} from './query.dtos.js';
import { groupChunksToDocuments } from '../application/group-chunks.util.js';

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
    const documents = groupChunksToDocuments(chunks);
    return { documents };
  }

  @Post('search/filtered')
  async searchFiltered(
    @Body() dto: FilteredSearchDto,
  ): Promise<SearchResponse> {
    const chunks = await this.filteredSearch.execute(dto);
    const documents = groupChunksToDocuments(chunks);
    return { documents };
  }

  @Post('ask')
  async ask(@Body() dto: AskQuestionDto): Promise<AskQuestionResponse> {
    return this.askQuestion.execute(dto);
  }

  @Sse('ask/stream')
  askStream(@Query() dto: AskQuestionDto): Observable<MessageEvent> {
    return from(this.askQuestion.executeStream(dto)).pipe(
      map((chunk) => ({ data: chunk }) as MessageEvent),
    );
  }

  @Post('retrieve')
  async retrieve(
    @Body() dto: SemanticSearchDto,
  ): Promise<{ chunks: ChunkReference[] }> {
    const chunks = await this.retrieveChunks.execute(dto);
    return { chunks };
  }
}
