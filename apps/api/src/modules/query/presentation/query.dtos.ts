import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class SemanticSearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number;
}

export class FilteredSearchDto {
  @IsString()
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
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number;
}

export class AskQuestionDto {
  @IsString()
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
