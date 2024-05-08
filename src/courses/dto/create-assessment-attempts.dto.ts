import { Injectable } from '@nestjs/common';
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

export class Attempt {
  @IsUUID()
  @IsNotEmpty()
  @Validate(UniqueColumnConstraint)
  question: IdDto['id'];

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @IsNotEmpty()
  choice: number;
}

export class CreateAssessmentAttemptsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  // @ArrayMaxSize(1)
  @Type(() => Attempt)
  attempt: Attempt[];

  @IsUUID()
  @IsNotEmpty()
  courseContentSub: IdDto['id'];
}
