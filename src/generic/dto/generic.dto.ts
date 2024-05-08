import { IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class IdDto {
  @IsUUID()
  id: UUID;
}

export class IdDtoAlias {
  @IsString()
  id: string;
}
