import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { ITrx } from './entities/transactions.entity';
import { IdDto } from 'src/generic/dto/generic.dto';

@Controller('v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}
}
