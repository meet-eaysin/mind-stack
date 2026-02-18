import { IsString, IsInt, Min, Max, IsOptional } from "class-validator";

export class AddTagDto {
  @IsString()
  chunkId!: string;

  @IsString()
  tagName!: string;
}

export class RemoveTagDto {
  @IsString()
  chunkId!: string;

  @IsString()
  tagName!: string;
}

export class AddNoteDto {
  @IsString()
  chunkId!: string;

  @IsString()
  content!: string;
}

export class UpdateNoteDto {
  @IsString()
  content!: string;
}

export class UpdateImportanceDto {
  @IsString()
  chunkId!: string;

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
