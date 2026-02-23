import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { RELATION_TYPE, type RelationType } from '@repo/shared-types';

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

  @IsEnum(RELATION_TYPE)
  type!: RelationType;
}
