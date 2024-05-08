import { IsString, IsNotEmpty } from 'class-validator';

export class CaptureOrderDto {
  @IsString()
  @IsNotEmpty()
  thirdPartyRef: string;
}
