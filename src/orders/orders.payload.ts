import { HttpStatus } from '@nestjs/common';

export class CreateOrderPayload {
  statusCode: HttpStatus;
  message: string;
  data: {
    orderNumber: string;
    status: string;
    link: string;
  };
}
