import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import type {
  DocumentListResponse,
  DocumentDetailResponse,
} from '@repo/shared-types';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../application/view-document.use-case.js';
import { AddTagUseCase } from '../application/add-tag.use-case.js';
import { RemoveTagUseCase } from '../application/remove-tag.use-case.js';
import { AddNoteUseCase } from '../application/add-note.use-case.js';
import { UpdateNoteUseCase } from '../application/update-note.use-case.js';
import { UpdateImportanceUseCase } from '../application/update-importance.use-case.js';
import {
  AddTagDto,
  RemoveTagDto,
  AddNoteDto,
  UpdateNoteDto,
  UpdateImportanceDto,
  PaginationQueryDto,
} from './knowledge.dtos.js';

@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly viewDocument: ViewDocumentUseCase,
    private readonly addTag: AddTagUseCase,
    private readonly removeTag: RemoveTagUseCase,
    private readonly addNote: AddNoteUseCase,
    private readonly updateNote: UpdateNoteUseCase,
    private readonly updateImportance: UpdateImportanceUseCase,
  ) {}

  @Get('documents')
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<DocumentListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const result = await this.listDocuments.execute({ page, pageSize });
    return {
      documents: result.documents.map((d) => ({
        id: d.id,
        title: d.title,
        sourceType: d.sourceType,
        sourceUrl: d.sourceUrl,
        chunkCount: d.chunkCount,
        createdAt: d.createdAt.toISOString(),
      })),
      total: result.total,
      page,
      pageSize,
    };
  }

  @Get('documents/:id')
  async detail(@Param('id') id: string): Promise<DocumentDetailResponse> {
    return this.viewDocument.execute(id);
  }

  @Post('tags')
  async createTag(@Body() dto: AddTagDto): Promise<{ success: boolean }> {
    await this.addTag.execute(dto);
    return { success: true };
  }

  @Delete('tags')
  async deleteTag(@Body() dto: RemoveTagDto): Promise<{ success: boolean }> {
    await this.removeTag.execute(dto);
    return { success: true };
  }

  @Post('notes')
  async createNote(@Body() dto: AddNoteDto): Promise<{ noteId: string }> {
    const note = await this.addNote.execute(dto);
    return { noteId: note.id };
  }

  @Put('notes/:id')
  async editNote(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<{ success: boolean }> {
    await this.updateNote.execute({ noteId: id, content: dto.content });
    return { success: true };
  }

  @Post('importance')
  async setImportance(
    @Body() dto: UpdateImportanceDto,
  ): Promise<{ success: boolean }> {
    await this.updateImportance.execute(dto);
    return { success: true };
  }
}
