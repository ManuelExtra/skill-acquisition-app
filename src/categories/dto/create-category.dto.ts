import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  isPublished: boolean;
}
