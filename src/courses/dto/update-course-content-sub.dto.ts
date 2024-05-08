import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseContentSubDto } from './create-course-content-sub.dto';

export class UpdateCourseContentSubDto extends PartialType(
  CreateCourseContentSubDto,
) {}
