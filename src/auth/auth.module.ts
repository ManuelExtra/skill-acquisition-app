import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { Auth } from './entities/auth.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { RolesGuard } from './guards/role.guard';
import { OrdersModule } from 'src/orders/orders.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    Auth,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: CourseAuthGuard,
    // },
  ],
  imports: [
    UsersModule,
    MailModule,
    OrdersModule,
    CoursesModule,
    TypeOrmModule.forFeature([Users]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '60d' },
      }),
    }),
  ],
})
export class AuthModule {}
