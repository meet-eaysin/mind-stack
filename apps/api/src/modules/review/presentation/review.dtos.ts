import { IsString, IsInt, Min, Max } from 'class-validator';

export class SubmitReviewFeedbackDto {
  @IsString()
  documentId!: string;

  @IsInt()
  @Min(0)
  @Max(5)
  score!: number;
}
