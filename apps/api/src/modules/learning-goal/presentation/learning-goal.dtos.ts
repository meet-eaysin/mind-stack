import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateLearningGoalDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  deadline?: string;
}

export class UpdateLearningGoalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}

export class AddItemToGoalDto {
  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @IsUUID()
  @IsOptional()
  documentId?: string;
}
