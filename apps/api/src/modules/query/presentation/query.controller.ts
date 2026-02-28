import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
  Query,
  Headers,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  SearchResponse,
  AskQuestionResponse,
  ChunkReference,
} from '@repo/shared-types';
import { SemanticSearchUseCase } from '@/modules/query/application/semantic-search.use-case';
import { FilteredSearchUseCase } from '@/modules/query/application/filtered-search.use-case';
import { AskQuestionUseCase } from '@/modules/query/application/ask-question.use-case';
import { RetrieveChunksUseCase } from '@/modules/query/application/retrieve-chunks.use-case';
import {
  SemanticSearchDto,
  FilteredSearchDto,
  AskQuestionDto,
} from '@/modules/query/presentation/query.dtos';
import { groupChunksToDocuments } from '@/modules/query/application/group-chunks.util';
import { getUserIdFromHeader } from '@/common/request-user';

@Controller('query')
export class QueryController {
  constructor(
    private readonly semanticSearch: SemanticSearchUseCase,
    private readonly filteredSearch: FilteredSearchUseCase,
    private readonly askQuestion: AskQuestionUseCase,
    private readonly retrieveChunks: RetrieveChunksUseCase,
  ) {}

  @Post('search')
  async search(
    @Body() dto: SemanticSearchDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<SearchResponse> {
    const chunks = await this.semanticSearch.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    const documents = groupChunksToDocuments(chunks);
    return { documents };
  }

  @Post('search/filtered')
  async searchFiltered(
    @Body() dto: FilteredSearchDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<SearchResponse> {
    const chunks = await this.filteredSearch.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    const documents = groupChunksToDocuments(chunks);
    return { documents };
  }

  @Post('ask')
  async ask(
    @Body() dto: AskQuestionDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<AskQuestionResponse> {
    return this.askQuestion.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
  }

  @Sse('ask/stream')
  askStream(
    @Query() dto: AskQuestionDto,
    @Headers('x-user-id') userId?: string,
  ): Observable<MessageEvent> {
    return from(
      this.askQuestion.executeStream({
        ...dto,
        userId: getUserIdFromHeader(userId),
      }),
    ).pipe(map((chunk) => ({ data: chunk })));
  }

  @Post('retrieve')
  async retrieve(
    @Body() dto: SemanticSearchDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ chunks: ChunkReference[] }> {
    const chunks = await this.retrieveChunks.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    return { chunks };
  }
}
