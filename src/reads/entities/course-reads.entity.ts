import { UUID } from 'crypto';
import { CourseContentSubs } from 'src/courses/entities/course.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import { Transactions } from 'src/transactions/entities/transactions.entity';
import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateCourseReadRecordDto } from '../dto/create-course-read-record.dto';

// Models
@Entity()
export class CourseReads {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne(
    (type) => CourseContentSubs,
    (contentSub) => contentSub.courseReads,
  )
  contentSub: CourseContentSubs['id'];

  @ManyToOne((type) => Users, (student) => student.courseReads)
  student: Users['id'];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(
    createCourseReadRecordDto: CreateCourseReadRecordDto,
    studentId: IdDto['id'],
  ): CourseReads {
    const courseRead = new CourseReads();

    courseRead.contentSub = createCourseReadRecordDto.courseContentSub;
    courseRead.student = studentId;

    return courseRead;
  }

  toJSON() {
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
