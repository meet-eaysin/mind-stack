import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import type {
  DocumentDetailResponse,
  DocumentListResponse,
  NoteResponse,
  ChunkReference,
  AnnotationType,
} from '@repo/shared-types';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../application/view-document.use-case.js';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case.js';
import { GetRelatedSuggestionsUseCase } from '../application/get-related-suggestions.use-case.js';
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
import type { NoteEntity } from '../domain/note.entity.js';
import { getUserIdFromHeader } from '../../../common/request-user.js';

@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly viewDocument: ViewDocumentUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
    private readonly getRelatedSuggestions: GetRelatedSuggestionsUseCase,
    private readonly addTag: AddTagUseCase,
    private readonly removeTag: RemoveTagUseCase,
    private readonly addNote: AddNoteUseCase,
    private readonly updateNote: UpdateNoteUseCase,
    private readonly updateImportance: UpdateImportanceUseCase,
    private readonly updateDocument: UpdateDocumentUseCase,
  ) {}

  private mapNoteToResponse(note: NoteEntity): NoteResponse {
    return {
      id: note.id,
      content: note.content,
      type: note.type as AnnotationType,
      chunkId: note.chunkId ?? null,
      selectedText: note.selectedText ?? null,
      metadata: note.metadata,
      createdAt: note.createdAt.toISOString(),
    };
  }

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
        processingError: d.processingError,
      })),
      total: result.total,
      page,
      pageSize,
    };
  }

  @Post('documents/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<{ success: boolean }> {
    await this.updateDocument.execute(id, dto);
    return { success: true };
  }

  @Get('documents/:id/details')
  async details(@Param('id') id: string): Promise<DocumentDetailResponse> {
    const result = await this.viewDocument.execute(id);
    const { document, chunks, tags, notes, importanceScore } = result;

    return {
      id: document.id,
      title: document.title,
      sourceType: document.sourceType,
      sourceUrl: document.sourceUrl,
      rawContent: document.rawContent,
      chunks: chunks.map((c) => ({
        id: c.id,
        content: c.content,
        startOffset: c.startOffset,
        endOffset: c.endOffset,
        createdAt: c.createdAt.toISOString(),
      })),
      tags: tags.map((t) => t.name),
      notes: notes.map((n) => this.mapNoteToResponse(n)),
      importanceScore,
      status: document.status,
      learningStatus: document.learningStatus,
      type: document.type,
      author: document.author,
      publisher: document.publisher,
      publishedAt: document.publishedAt
        ? document.publishedAt.toISOString()
        : null,
      language: document.language,
      addedByUserAt: document.addedByUserAt.toISOString(),
      createdAt: document.createdAt.toISOString(),
      processingError: document.processingError,
    };
  }

  @Get('documents/:id/related')
  async getRelated(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<ChunkReference[]> {
    return this.getRelatedSuggestions.execute(id, getUserIdFromHeader(userId));
  }

  @Get('documents/:id/status')
  async getStatus(@Param('id') id: string): Promise<{ status: string }> {
    const result = await this.viewDocument.execute(id);
    return { status: result.document.status };
  }

  @Delete('documents/:id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.deleteDocument.execute(id);
    return { success: true };
  }

  @Get('documents/:id/notes')
  async getNotes(@Param('id') id: string): Promise<NoteResponse[]> {
    const result = await this.viewDocument.execute(id);
    return result.notes.map((n) => this.mapNoteToResponse(n));
  }

  @Post('tags/add')
  async addTagToDocument(
    @Body() dto: AddTagDto,
  ): Promise<{ success: boolean }> {
    await this.addTag.execute({
      documentId: dto.documentId,
      tagName: dto.tagName,
    });
    return { success: true };
  }

  @Post('tags/remove')
  async removeTagFromDocument(
    @Body() dto: RemoveTagDto,
  ): Promise<{ success: boolean }> {
    await this.removeTag.execute({
      documentId: dto.documentId,
      tagName: dto.tagName,
    });
    return { success: true };
  }

  @Post('notes/add')
  async createNote(@Body() dto: AddNoteDto): Promise<NoteResponse> {
    const note = await this.addNote.execute({
      documentId: dto.documentId,
      content: dto.content,
      type: dto.type,
      chunkId: dto.chunkId,
      selectedText: dto.selectedText,
      metadata: dto.metadata,
    });
    return this.mapNoteToResponse(note);
  }

  @Post('notes/update/:id')
  async updateExistingNote(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponse> {
    const note = await this.updateNote.execute({
      noteId: id,
      content: dto.content,
    });
    return this.mapNoteToResponse(note);
  }

  @Post('importance')
  async updateDocumentImportance(
    @Body() dto: UpdateImportanceDto,
  ): Promise<{ success: boolean }> {
    await this.updateImportance.execute({
      documentId: dto.documentId,
      score: dto.score,
    });
    return { success: true };
  }
}
