import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentQuestionDto } from './create-assessment-question.dto';

export class UpdateAssessmentQuestionDto extends PartialType(
  CreateAssessmentQuestionDto,
) {}
