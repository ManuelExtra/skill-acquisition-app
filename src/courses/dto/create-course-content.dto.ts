import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';

export class CreateCourseContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  course: IdDto['id'];
}
