import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  user: IdDto['id'];

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  narration: string;
}
