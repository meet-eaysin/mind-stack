import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class ExportChunksDto {
  @IsArray()
  @IsString({ each: true })
  chunkIds!: string[];
}

export class NotionImportDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
