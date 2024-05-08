import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { toNumber } from 'lodash';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GenericFilter {
  @Transform(({ value }) => toNumber(value))
  // @Transform(({ value }) => toNumber(value, { default: 1, min: 1 }))
  @IsNumber({}, { message: ' "page" attribute should be a number' })
  public page?: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber({}, { message: ' "pageSize" attribute should be a number ' })
  public pageSize?: number;

  @IsOptional()
  public orderBy?: string;

  @IsEnum(SortOrder)
  @IsOptional()
  public sortOrder?: SortOrder = SortOrder.DESC;
}
