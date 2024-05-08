import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDoc, Users } from './entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { GenericModule } from 'src/generic/generic.module';

@Module({
  imports: [MailModule, GenericModule, TypeOrmModule.forFeature([Users])],
  controllers: [UsersController],
  providers: [UsersService, UserDoc],
  exports: [UsersService, UserDoc],
})
export class UsersModule {}
