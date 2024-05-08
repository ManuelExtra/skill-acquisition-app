import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  shortDesc: string;

  @IsString()
  @IsNotEmpty()
  fullDesc: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsOptional()
  @IsNumber()
  discount: number;

  @IsString()
  @IsNotEmpty()
  coverImage: string;

  @IsUUID()
  @IsNotEmpty()
  program: IdDto['id'];

  @IsOptional()
  @IsBoolean()
  isPublished: boolean;
}
