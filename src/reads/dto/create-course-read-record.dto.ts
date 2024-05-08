import { IsNotEmpty, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class CreateCourseReadRecordDto {
  @IsUUID()
  @IsNotEmpty()
  courseContentSub: UUID;
}
