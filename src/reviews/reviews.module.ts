import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reviews } from './entities/reviews.entity';
import { CoursesModule } from 'src/courses/courses.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    CoursesModule,
    NotificationsModule,
    OrdersModule,
    TypeOrmModule.forFeature([Reviews]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, Reviews],
  exports: [ReviewsService, Reviews],
})
export class ReviewsModule {}
