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
import { CreateCategoryDto } from '../dto/create-category.dto';

// Interfaces
export interface ICategory {
  title?: string;
  published?: number;
}

@Entity()
export class Categories {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @OneToMany((type) => Courses, (course) => course.category)
  courses: Courses[];

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createCategoryDto: CreateCategoryDto) {
    const Category = new Categories();
    Category.title = createCategoryDto.title;

    Category.isPublished = createCategoryDto.isPublished;

    return Category;
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
