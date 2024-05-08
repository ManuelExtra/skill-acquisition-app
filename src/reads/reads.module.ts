import { Module } from '@nestjs/common';
import { ReadsService } from './reads.service';
import { ReadsController } from './reads.controller';
import { CourseReads } from './entities/course-reads.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CourseReads])],
  controllers: [ReadsController],
  providers: [ReadsService, CourseReads],
  exports: [ReadsService],
})
export class ReadsModule {}
