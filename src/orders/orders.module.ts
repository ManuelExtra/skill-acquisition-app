import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from './entities/orders.entity';
import { OrderItems } from './entities/order-items.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { MailModule } from 'src/mail/mail.module';
import { PaypalService } from './provider/paypal.provider';
import { CoursesModule } from 'src/courses/courses.module';
import { ReadsModule } from 'src/reads/reads.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TransactionsModule,
    MailModule,
    CoursesModule,
    ReadsModule,
    NotificationsModule,
    TypeOrmModule.forFeature([Orders, OrderItems]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, Orders, OrderItems, PaypalService],
  exports: [OrdersService],
})
export class OrdersModule {}
