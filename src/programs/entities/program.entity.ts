import { Courses } from 'src/courses/entities/course.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateProgramDto } from '../dto/create-program.dto';

// Interfaces
export interface IProgram {
  title?: string;
  published?: number;
}

@Entity()
export class Programs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @OneToMany((type) => Courses, (course) => course.program)
  courses: Courses[];

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createProgramDto: CreateProgramDto) {
    const program = new Programs();
    program.title = createProgramDto.title;

    program.isPublished = createProgramDto.isPublished;

    return program;
  }

  client() {
    delete this.createdDate;
    delete this.updatedDate;
    delete this.deletedDate;
    delete this.isPublished;
    return this;
  }

  toJSON() {
    delete this.deletedDate;
    delete this.updatedDate;
    return this;
  }
}
