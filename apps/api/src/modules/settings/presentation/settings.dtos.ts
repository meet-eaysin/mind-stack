import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from '@repo/shared-types';

export class UpdateLlmConfigDto {
  @IsEnum(MODEL_PROVIDER)
  provider!: ModelProvider;

  @IsString()
  model!: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(MODEL_CAPABILITY, { each: true })
  enabledCapabilities!: ModelCapability[];
}
