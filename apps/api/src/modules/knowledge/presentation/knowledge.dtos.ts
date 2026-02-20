import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

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
