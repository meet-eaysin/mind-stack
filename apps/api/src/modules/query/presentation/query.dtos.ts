import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  Matches,
} from 'class-validator';

export class SemanticSearchDto {
  @IsString()
  @Matches(/\S/, { message: 'query must not be empty' })
  query!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number;
}

export class FilteredSearchDto {
  @IsString()
  @Matches(/\S/, { message: 'query must not be empty' })
  query!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsOptional()
  @IsString()
  conceptId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number;
}

export class AskQuestionDto {
  @IsString()
  @Matches(/\S/, { message: 'question must not be empty' })
  question!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;
}
