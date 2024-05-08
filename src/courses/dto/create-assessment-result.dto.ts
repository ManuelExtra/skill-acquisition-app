import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';
import { CourseContentSubMediaTypes } from '../entities/course.entity';

export class CreateAssessmentResultDto {
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  score: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  total: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  percent: number;

  @IsUUID()
  @IsNotEmpty()
  student: IdDto['id'];

  @IsUUID()
  @IsNotEmpty()
  courseContentSub: IdDto['id'];
}
