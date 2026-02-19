import { IsString, IsOptional, IsUrl } from 'class-validator';

export class IngestUrlDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class IngestTextDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;
}

export class IngestPdfDto {
  @IsString()
  title!: string;

  @IsString()
  fileBase64!: string;
}

export class IngestYoutubeDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  title?: string;
}
