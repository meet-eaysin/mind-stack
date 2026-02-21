import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';

export class IngestUrlDto {
  @IsUrl()
  @IsNotEmpty()
  url: string = '';

  @IsOptional()
  @IsString()
  title?: string;
}

export class IngestTextDto {
  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsNotEmpty()
  content: string = '';
}

export class IngestPdfDto {
  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsNotEmpty()
  fileBase64: string = '';
}

export class IngestYoutubeDto {
  @IsUrl()
  @IsNotEmpty()
  url: string = '';

  @IsString()
  @IsOptional()
  title?: string;
}

export class IngestClipDto {
  @IsUrl()
  @IsNotEmpty()
  url: string = '';

  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsNotEmpty()
  content: string = '';
}
