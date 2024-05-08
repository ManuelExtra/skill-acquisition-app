import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';

export class CreateAssessmentQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsBoolean()
  @IsOptional()
  isPublished: boolean;

  @IsUUID()
  @IsNotEmpty()
  courseContentSub: IdDto['id'];

  @IsArray()
  @IsNotEmpty()
  options: JSON;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  point: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  correctOption: number;
}
