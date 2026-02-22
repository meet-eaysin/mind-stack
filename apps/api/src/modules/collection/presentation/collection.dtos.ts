import { IsString, IsOptional, IsInt, IsArray, IsUUID } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  goal?: string;
}

export class UpdateCollectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  goal?: string;
}

export class AddDocumentToCollectionDto {
  @IsUUID()
  documentId!: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsUUID()
  @IsOptional()
  prerequisiteId?: string;
}

export class ReorderCollectionItemsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  itemIds!: string[];
}
