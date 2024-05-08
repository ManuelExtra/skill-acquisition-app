import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';
import { CourseContentSubAssessmentQuestionsService } from '../courses.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueColumnConstraint implements ValidatorConstraintInterface {
  async validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    return true;
  }
}

export class Sequence {
  @IsUUID()
  @IsNotEmpty()
  @Validate(UniqueColumnConstraint)
  id: IdDto['id'];

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  order: number;
}

export class ChangeContentSubOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  // @ArrayMaxSize(1)
  @Type(() => Sequence)
  sequence: Sequence[];

  @IsNotEmpty()
  @IsUUID()
  content: IdDto['id'];
}
