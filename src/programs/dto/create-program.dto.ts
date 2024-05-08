import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  isPublished: boolean;
}
