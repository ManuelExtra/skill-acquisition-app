import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { IsString } from 'class-validator';

import { genSaltSync, hashSync, compareSync } from 'bcrypt';
import { Injectable } from '@nestjs/common';
import {
  AssessmentAttempts,
  AssessmentResults,
  Courses,
} from 'src/courses/entities/course.entity';
import { Orders } from 'src/orders/entities/orders.entity';
import { Transactions } from 'src/transactions/entities/transactions.entity';
import { CourseReads } from 'src/reads/entities/course-reads.entity';
import { Reviews } from 'src/reviews/entities/reviews.entity';
import { Notifications } from 'src/notifications/entities/notifications.entity';

// Validators
export class CreateUser {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  password: string;
}

// Interfaces
export interface IUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  active?: number;
  suspended?: number;
  verifiedAsHost?: number;
}

// Extras
export enum UserRole {
  ADMIN = 'admin',
  SUBADMIN = 'sub-admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

// User Model, Document & Schema
@Injectable()
export class UserSchema {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isSuspended: boolean;
  role: UserRole;
  createdDate: Date;
}

export class UserDoc {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isSuspended: boolean;
  role: UserRole;
  createdDate: Date;

  hashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  createUser(data: CreateUser, role: UserRole) {
    const { firstName, lastName, email, phone, password } = data;

    const user = new Users();

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.password = this.hashPassword(password);
    user.role = role;
    user.isActive = false;
    user.createdDate = new Date();

    return user;
  }
}

@Entity()
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: null })
  nickname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  verifiedAsHost: boolean;

  @Column({ default: false })
  isSuspended: boolean;

  @Column()
  role: UserRole;

  @Column({ default: null })
  picture: string;

  @Column({ type: 'text', default: null })
  address: string;

  @Column({ default: null })
  state: string;

  @Column({ default: null })
  country: string;

  @Column({ default: null })
  facebookUrl: string;

  @Column({ default: null })
  twitterUrl: string;

  @Column({ default: null })
  linkedinUrl: string;

  @Column({ default: null })
  instagramUrl: string;

  @Column({ default: null })
  governmentID: string;

  @Column({ default: null })
  bio: string;

  @Column({ default: null })
  dob: string; //YYYY-MM-DD

  @Column({ default: null })
  roomPicture: string;

  @Column('text', { default: null })
  accessToken: string;

  @OneToMany(() => Courses, (course) => course.instructor)
  courses: Courses[];

  @OneToMany(
    () => AssessmentAttempts,
    (assessmentAttempt) => assessmentAttempt.student,
  )
  assessmentAttempts: AssessmentAttempts[];

  @OneToMany(
    () => AssessmentResults,
    (assessmentResult) => assessmentResult.student,
  )
  assessmentResults: AssessmentResults[];

  @OneToMany(() => Orders, (order) => order.buyer)
  orders: Orders[];

  @OneToMany(() => Transactions, (transaction) => transaction.user)
  transactions: Transactions[];

  @OneToMany(() => CourseReads, (courseRead) => courseRead.student)
  courseReads: CourseReads[];

  @OneToMany(() => Reviews, (review) => review.user)
  reviews: Reviews[];

  @OneToMany(() => Notifications, (notification) => notification.user)
  notifications: Notifications[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  isPasswordSame(password: string) {
    return compareSync(password, this.password);
  }

  basicInfo() {
    delete this.password;
    delete this.deletedDate;
    delete this.updatedDate;
    delete this.isActive;
    delete this.isSuspended;
    delete this.accessToken;
    delete this.governmentID;
    delete this.roomPicture;
    return this;
  }

  genericInfo() {
    delete this.password;
    delete this.deletedDate;
    delete this.updatedDate;
    delete this.accessToken;
    return this;
  }

  toJSON() {
    delete this.password;
    delete this.deletedDate;
    delete this.updatedDate;
    delete this.accessToken;
    return this;
  }
}
