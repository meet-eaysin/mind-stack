import { IsArray, IsString } from "class-validator";

export class ExportChunksDto {
  @IsArray()
  @IsString({ each: true })
  chunkIds!: string[];
}
