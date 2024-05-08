import { IsNotEmpty, IsString } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNumber: string; // this is actually the third-party reference
}
