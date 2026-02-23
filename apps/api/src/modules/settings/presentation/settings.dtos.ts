import { IsEnum, IsString } from 'class-validator';
import { MODEL_PROVIDER, type ModelProvider } from '@repo/shared-types';

export class UpdateLlmConfigDto {
  @IsEnum(MODEL_PROVIDER)
  embeddingProvider!: ModelProvider;

  @IsString()
  embeddingModel!: string;

  @IsEnum(MODEL_PROVIDER)
  generationProvider!: ModelProvider;

  @IsString()
  generationModel!: string;
}
