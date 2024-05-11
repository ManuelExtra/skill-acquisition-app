import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Users } from './users/entities/user.entity';
import { MailModule } from './mail/mail.module';
import { UploadModule } from './upload/upload.module';
import { GenericModule } from './generic/generic.module';
import { CoursesModule } from './courses/courses.module';
import dbConfig from './config/db.config';
import {
  AssessmentAttempts,
  AssessmentResults,
  CourseContents,
  CourseContentSubAssessmentQuestions,
  CourseContentSubs,
  Courses,
} from './courses/entities/course.entity';
import { CourseReads } from './reads/entities/course-reads.entity';
import { OrdersModule } from './orders/orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { Orders } from './orders/entities/orders.entity';
import { OrderItems } from './orders/entities/order-items.entity';
import { Transactions } from './transactions/entities/transactions.entity';
import { ReadsModule } from './reads/reads.module';
import { ReviewsModule } from './reviews/reviews.module';
import { Reviews } from './reviews/entities/reviews.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { Notifications } from './notifications/entities/notifications.entity';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          load: [dbConfig],
        }),
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [
          Users,
          Courses,
          CourseContents,
          CourseContentSubs,
          CourseContentSubAssessmentQuestions,
          AssessmentAttempts,
          AssessmentResults,
          Orders,
          OrderItems,
          Transactions,
          CourseReads,
          Reviews,
          Notifications,
        ],

        synchronize: true,
        autoLoadEntities: true,
        // synchronize: configService.get<boolean>('database.synchronize'),
        // autoLoadEntities: configService.get<boolean>(
        //   'database.autoLoadEntities',
        // ),
      }),
    }),
    AuthModule,
    UsersModule,
    MailModule,
    UploadModule,
    GenericModule,
    CoursesModule,
    OrdersModule,
    TransactionsModule,
    ReadsModule,
    ReviewsModule,
    NotificationsModule,
    CategoriesModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
