import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class ConceptNeighborhoodDto {
  @IsString()
  conceptId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  depth?: number;
}

export class BuildGraphDto {
  @IsString()
  chunkContent!: string;

  @IsString()
  chunkId!: string;
}

export class CreateRelationDto {
  @IsString()
  fromId!: string;

  @IsString()
  toId!: string;

  @IsString()
  type!: string;
}
