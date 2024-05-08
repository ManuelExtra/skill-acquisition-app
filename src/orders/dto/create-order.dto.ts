import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Validate,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';
import { UniqueColumnConstraint } from 'src/courses/dto/create-assessment-attempts.dto';
import { IdDto } from 'src/generic/dto/generic.dto';

export class ICourse {
  @IsUUID()
  @IsNotEmpty()
  @Validate(UniqueColumnConstraint)
  id: IdDto['id'];

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsNotEmpty()
  price: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ICourse)
  courses: ICourse[];

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class CreateOrderItemDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  courses: ICourse[];

  @IsUUID()
  @IsNotEmpty()
  order: IdDto['id'];
}
