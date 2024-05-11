import { IdDto } from 'src/generic/dto/generic.dto';
import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateCourseDto } from '../dto/create-course.dto';
import { CreateCourseContentDto } from '../dto/create-course-content.dto';
import { CreateCourseContentSubDto } from '../dto/create-course-content-sub.dto';
import { CreateAssessmentQuestionDto } from '../dto/create-assessment-question.dto';
import { CreateAssessmentAttemptsDto } from '../dto/create-assessment-attempts.dto';
import { CreateAssessmentResultDto } from '../dto/create-assessment-result.dto';
import { OrderItems } from 'src/orders/entities/order-items.entity';
import { CourseReads } from 'src/reads/entities/course-reads.entity';
import { Reviews } from 'src/reviews/entities/reviews.entity';
import { Categories } from 'src/categories/entities/categories.entity';

// Interfaces
export interface ICourse {
  title?: string;
  price?: number;
  instructor?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  category?: {
    id: string;
  };
}
export interface ICourseContent {
  title?: string;
  course?: {
    title: string;
  };
}
export interface ICourseContentSub {
  title?: string;
  course?: {
    title: string;
  };
  courseContent?: {
    title: string;
  };
}
export interface ICourseContentSubAssessmentQuestion {
  question?: string;
  courseContentSub?: {
    title: string;
  };
}
export interface IAssessmentAttempt {
  assessmentQuestion?: {
    question: string;
  };
}
export interface IAssessmentAttemptData {
  student: IdDto['id'];
  assessmentQuestion: IdDto['id'];
  choice: number;
}
export interface IAssessmentResult {
  // assessmentQuestion?: {
  //   question: string;
  // };
}

/**
 * Course models
 */
@Entity()
export class Courses {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  shortDesc: string;

  @Column({ type: 'text' })
  fullDesc: string;

  @Column({ type: 'double' })
  price: number;

  @Column({ default: 0 })
  discount: number;

  @Column({ default: false })
  isPublished: boolean;

  @Column()
  coverImage: string;

  @ManyToOne(() => Users, (user) => user.courses)
  instructor: Users['id'];

  @ManyToOne(() => Categories)
  category: Categories['id'];

  @OneToMany((type) => CourseContents, (courseContent) => courseContent.course)
  contents: CourseContents[];

  @OneToMany((type) => OrderItems, (orderItem) => orderItem.course)
  orderItems: OrderItems[];

  @OneToMany((type) => Reviews, (review) => review.item)
  reviews: Reviews[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createCourseDto: CreateCourseDto, instructor: IdDto) {
    const course = new Courses();
    course.title = createCourseDto.title;
    course.shortDesc = createCourseDto.shortDesc;
    course.fullDesc = createCourseDto.fullDesc;
    course.price = +createCourseDto.price.toFixed(2);
    course.discount = createCourseDto.discount;
    course.isPublished = createCourseDto.isPublished;
    course.coverImage = createCourseDto.coverImage;
    course.instructor = instructor.id;
    course.category = createCourseDto.category;

    return course;
  }

  getDiscount() {
    const discountedPrice = Boolean(this.discount)
      ? +(this.price - this.price * (this.discount / 100)).toFixed(2)
      : null;
    return discountedPrice;
  }

  getFormattedPrices() {
    const discountedPrice = Boolean(this.discount)
      ? +(this.price - this.price * (this.discount / 100)).toFixed(2)
      : null;
    const originalPriceFormat = `$${this.price.toFixed(2)}`;
    const discountPriceFormat = Boolean(this.discount)
      ? `$${discountedPrice}`
      : null;
    const discountFormat = Boolean(this.discount)
      ? `${this.discount}% off`
      : null;

    return {
      originalPriceFormat,
      discountPriceFormat,
      discountedPrice,
      discountFormat,
    };
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
    return this;
  }
}
@Entity()
export class CourseContents {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => Courses, (course) => course.contents)
  course: Courses['id'];

  @OneToMany(
    (type) => CourseContentSubs,
    (courseContentSub) => courseContentSub.courseContent,
  )
  courseContentSubs: CourseContentSubs[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createCourseContentDto: CreateCourseContentDto) {
    const courseContent = new CourseContents();
    courseContent.title = createCourseContentDto.title;
    courseContent.course = createCourseContentDto.course;

    return courseContent;
  }

  toJSON(client?: boolean) {
    delete this.createdDate;
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
@Entity()
export class CourseContentSubs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order: number;

  @Column({ default: null })
  title: string;

  @ManyToOne(() => Courses, (course) => course.contents)
  course: Courses['id'];

  @ManyToOne(
    () => CourseContents,
    (courseContent) => courseContent.courseContentSubs,
  )
  courseContent: CourseContents['id'];

  @OneToMany(
    () => CourseContentSubAssessmentQuestions,
    (courseContentSubAssessmentQuestion) =>
      courseContentSubAssessmentQuestion.courseContentSub,
  )
  contentSubQuestions: CourseContentSubAssessmentQuestions[];

  @OneToMany(
    () => AssessmentResults,
    (assessmentResult) => assessmentResult.courseContentSub,
  )
  assessmentResults: AssessmentResults[];

  @OneToMany((type) => CourseReads, (courseRead) => courseRead.contentSub)
  courseReads: CourseReads[];

  @Column({ default: null })
  duration: number; // In minutes

  @Column({ type: 'text', default: null })
  media: string;

  @Column({ default: null })
  previewUrl: string;

  @Column({ default: null })
  mediaType: CourseContentSubMediaTypes;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createCourseContentSubDto: CreateCourseContentSubDto) {
    const courseContentSub = new CourseContentSubs();
    courseContentSub.title = createCourseContentSubDto.title;
    courseContentSub.course = createCourseContentSubDto.course;
    courseContentSub.courseContent = createCourseContentSubDto.courseContent;
    courseContentSub.duration = createCourseContentSubDto.duration;
    courseContentSub.media = createCourseContentSubDto.media;
    courseContentSub.previewUrl = createCourseContentSubDto.previewUrl;
    courseContentSub.mediaType = createCourseContentSubDto.mediaType;

    return courseContentSub;
  }

  toJSON() {
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}

/**
 * Additional stuffs
 */
export enum CourseContentSubMediaTypes {
  AUDIO = 'audio',
  VIDEO = 'video',
  IMAGE = 'image',
  DOC = 'document',
  ASSESSMENT = 'assessment',
}
export class AdditionalCoursePayload {
  originalPriceFormat: string;
  discountPriceFormat: string;
  discountedPrice: number;
  discountFormat: string;
}
export class AssessmentResultPayload {
  score: number;
  total: number;
  percent: number;
}

/**
 * Assessment models
 */
@Entity()
export class CourseContentSubAssessmentQuestions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json' })
  options: JSON;

  @Column()
  correctOption: number;

  @Column()
  point: number;

  @Column({ default: false })
  isPublished: boolean;

  @ManyToOne(
    () => CourseContentSubs,
    (courseContentSub) => courseContentSub.contentSubQuestions,
  )
  courseContentSub: CourseContentSubs['id'];

  @OneToMany(
    () => AssessmentAttempts,
    (assessmentAttempt) => assessmentAttempt.assessmentQuestion,
  )
  attempts: AssessmentAttempts[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createAssessmentQuestionDto: CreateAssessmentQuestionDto) {
    const assessmentQuestion = new CourseContentSubAssessmentQuestions();
    assessmentQuestion.question = createAssessmentQuestionDto.question;

    assessmentQuestion.options = createAssessmentQuestionDto.options;
    assessmentQuestion.point = createAssessmentQuestionDto.point;
    assessmentQuestion.isPublished = createAssessmentQuestionDto.isPublished;
    assessmentQuestion.correctOption =
      createAssessmentQuestionDto.correctOption;

    assessmentQuestion.courseContentSub =
      createAssessmentQuestionDto.courseContentSub;

    return assessmentQuestion;
  }

  toJSON() {
    delete this.createdDate;
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
@Entity()
export class AssessmentAttempts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Users, (user) => user.assessmentAttempts)
  student: Users['id'];

  @ManyToOne(
    () => CourseContentSubAssessmentQuestions,
    (assessmentQuestion) => assessmentQuestion.attempts,
  )
  // @Validate(UniqueColumnConstraint)
  assessmentQuestion: CourseContentSubAssessmentQuestions['id'];

  @Column()
  choice: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  collect(
    createAssessmentAttemptsDto: CreateAssessmentAttemptsDto,
    student: IdDto['id'],
  ) {
    const attemptData = [];
    for (
      let index = 0;
      index < createAssessmentAttemptsDto.attempt.length;
      index++
    ) {
      const attemptDetail = createAssessmentAttemptsDto.attempt[index];

      attemptData.push({
        student,
        assessmentQuestion: attemptDetail.question,
        choice: attemptDetail.choice,
      });
    }

    return attemptData;
  }

  getAssessmentQuestionIds(attemptData: IAssessmentAttemptData[]) {
    const ids = attemptData.map((attempt) => {
      return attempt.assessmentQuestion;
    });
    return ids;
  }

  getStudentIds(attemptData: IAssessmentAttemptData[]) {
    const studentIds = attemptData.map((attempt) => {
      return attempt.student;
    });
    return studentIds;
  }

  toJSON() {
    delete this.createdDate;
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
@Entity()
export class AssessmentResults {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => CourseContentSubs,
    (courseContentSub) => courseContentSub.assessmentResults,
  )
  courseContentSub: CourseContentSubs['id'];

  @Column({ type: 'double' })
  score: number;

  @Column({ type: 'double' })
  total: number;

  @ManyToOne(() => Users, (student) => student.assessmentResults)
  student: Users['id'];

  @Column({ type: 'double' })
  percent: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createAssessmentResultDto: CreateAssessmentResultDto) {
    const assessmentResult = new CreateAssessmentResultDto();

    assessmentResult.score = createAssessmentResultDto.score;
    assessmentResult.total = createAssessmentResultDto.total;
    assessmentResult.percent = +createAssessmentResultDto.percent.toFixed(1);
    assessmentResult.student = createAssessmentResultDto.student;
    assessmentResult.courseContentSub =
      createAssessmentResultDto.courseContentSub;

    return assessmentResult;
  }

  toJSON() {
    delete this.id;
    delete this.createdDate;
    delete this.updatedDate;
    delete this.deletedDate;
    return this;
  }
}
