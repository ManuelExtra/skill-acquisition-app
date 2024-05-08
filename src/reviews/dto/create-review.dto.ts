import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';
import { UUID } from 'crypto';

export class CreateCourseReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsUUID()
  @IsNotEmpty()
  item: UUID;
}
