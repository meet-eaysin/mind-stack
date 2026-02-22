import { IsString, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import {
  LEARNING_STATUS,
  ANNOTATION_TYPE,
  DOCUMENT_TYPE,
  type LearningStatus,
  type DocumentType,
  type AnnotationType,
} from '@repo/shared-types';

export class AddTagDto {
  @IsString()
  documentId!: string;

  @IsString()
  tagName!: string;
}

export class RemoveTagDto {
  @IsString()
  documentId!: string;

  @IsString()
  tagName!: string;
}

export class AddNoteDto {
  @IsString()
  documentId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(ANNOTATION_TYPE)
  type?: AnnotationType;

  @IsOptional()
  @IsString()
  chunkId?: string;

  @IsOptional()
  @IsString()
  selectedText?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateNoteDto {
  @IsString()
  content!: string;
}

export class UpdateImportanceDto {
  @IsString()
  documentId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;
}

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsEnum(LEARNING_STATUS)
  learningStatus?: LearningStatus;

  @IsOptional()
  @IsEnum(DOCUMENT_TYPE)
  type?: DocumentType;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
