import { UUID } from 'crypto';
import { CourseContentSubs, Courses } from 'src/courses/entities/course.entity';
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
import { CreateCourseReviewDto } from '../dto/create-review.dto';

// Interfaces
export interface ICourseReview {
  user?: {
    firstName: string;
    lastName: string;
  };
  rating?: number;
  item: {
    title: string;
  };
  muted: number;
}

// Enums
export enum ReviewFor {
  COURSE = 'course',
}

// Models
@Entity()
export class Reviews {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne((type) => Users, (user) => user.reviews)
  user: Users['id'];

  @Column()
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column()
  reviewFor: ReviewFor;

  @ManyToOne((type) => Courses, (course) => course.reviews)
  item: Courses['id'];

  @Column({ default: false })
  muted: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(
    createCourseReviewDto: CreateCourseReviewDto,
    studentId: IdDto['id'],
    reviewFor: ReviewFor,
  ): Reviews {
    const review = new Reviews();

    review.rating = createCourseReviewDto.rating;
    review.comment = createCourseReviewDto.comment;
    review.item = createCourseReviewDto.item;
    review.reviewFor = reviewFor;
    review.user = studentId;

    return review;
  }

  toJSON() {
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
