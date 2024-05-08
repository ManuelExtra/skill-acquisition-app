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

export class CreateCourseContentSubDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  course: IdDto['id'];

  @IsUUID()
  @IsNotEmpty()
  courseContent: IdDto['id'];

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsNotEmpty()
  media: string; // Paid for to view - This could be a url or an html content

  @IsUrl()
  @IsOptional()
  previewUrl: string; // Not paid for to view

  @IsEnum(CourseContentSubMediaTypes)
  @IsNotEmpty()
  mediaType: CourseContentSubMediaTypes;
}
