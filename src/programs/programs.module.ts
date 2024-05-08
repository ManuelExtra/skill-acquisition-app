import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programs } from './entities/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Programs])],
  controllers: [ProgramsController],
  providers: [ProgramsService, Programs],
  exports: [ProgramsService],
})
export class ProgramsModule {}
