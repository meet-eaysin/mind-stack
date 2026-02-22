import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import type {
  DocumentListResponse,
  DocumentDetailResponse,
  LearningStatus,
  DocumentType,
} from '@repo/shared-types';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../application/view-document.use-case.js';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case.js';
import { AddTagUseCase } from '../application/add-tag.use-case.js';
import { RemoveTagUseCase } from '../application/remove-tag.use-case.js';
import { AddNoteUseCase } from '../application/add-note.use-case.js';
import { UpdateNoteUseCase } from '../application/update-note.use-case.js';
import { UpdateImportanceUseCase } from '../application/update-importance.use-case.js';
import { UpdateDocumentUseCase } from '../application/update-document.use-case.js';
import {
  AddTagDto,
  RemoveTagDto,
  AddNoteDto,
  UpdateNoteDto,
  UpdateImportanceDto,
  PaginationQueryDto,
  UpdateDocumentDto,
} from './knowledge.dtos.js';

@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly viewDocument: ViewDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly addTag: AddTagUseCase,
    private readonly removeTag: RemoveTagUseCase,
    private readonly addNote: AddNoteUseCase,
    private readonly updateNote: UpdateNoteUseCase,
    private readonly updateImportance: UpdateImportanceUseCase,
    private readonly updateDocument: UpdateDocumentUseCase,
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
        status: d.status,
        learningStatus: d.learningStatus,
        type: d.type,
        author: d.author,
        publisher: d.publisher,
        publishedAt: d.publishedAt ? d.publishedAt.toISOString() : null,
        language: d.language,
        addedByUserAt: d.addedByUserAt.toISOString(),
        chunkCount: d.chunkCount,
        createdAt: d.createdAt.toISOString(),
      })),
      total: result.total,
      page,
      pageSize,
    };
  }

  @Get('documents/:id')
  async detail(
    @Param('id') id: string,
  ): Promise<{ document: DocumentDetailResponse }> {
    const document = await this.viewDocument.execute(id);
    return { document };
  }

  @Get('documents/:id/status')
  async getStatus(@Param('id') id: string): Promise<{ status: string }> {
    const document = await this.viewDocument.execute(id);
    return {
      status: document.status,
    };
  }

  @Delete('documents/:id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.deleteDocument.execute(id);
    return { success: true };
  }

  @Patch('documents/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<{ success: boolean }> {
    const payload: {
      title?: string;
      sourceUrl?: string;
      learningStatus?: LearningStatus;
      type?: DocumentType;
      author?: string;
      publisher?: string;
      publishedAt?: string;
      language?: string;
    } = {};
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.sourceUrl !== undefined) payload.sourceUrl = dto.sourceUrl;
    if (dto.learningStatus !== undefined)
      payload.learningStatus = dto.learningStatus;
    if (dto.type !== undefined) payload.type = dto.type;
    if (dto.author !== undefined) payload.author = dto.author;
    if (dto.publisher !== undefined) payload.publisher = dto.publisher;
    if (dto.publishedAt !== undefined) payload.publishedAt = dto.publishedAt;
    if (dto.language !== undefined) payload.language = dto.language;

    await this.updateDocument.execute(id, payload);
    return { success: true };
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
