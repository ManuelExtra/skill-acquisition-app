import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UUID } from 'crypto';
import { IdDto } from 'src/generic/dto/generic.dto';
import { UserRole } from 'src/users/entities/user.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  userGroup: UserRole;

  @IsString()
  @IsOptional()
  user?: IdDto['id'];
}
