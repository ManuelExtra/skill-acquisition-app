import { Module } from '@nestjs/common';
import {
  AssessmentAttemptsService,
  AssessmentResultsService,
  CourseContentsService,
  CourseContentSubAssessmentQuestionsService,
  CourseContentSubsService,
  CoursesService,
} from './courses.service';
import {
  AssessmentController,
  CourseContentsController,
  CourseContentSubsController,
  CoursesController,
} from './courses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssessmentAttempts,
  AssessmentResults,
  CourseContents,
  CourseContentSubAssessmentQuestions,
  CourseContentSubs,
  Courses,
} from './entities/course.entity';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { Categories } from 'src/categories/entities/categories.entity';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    CategoriesModule,
    TypeOrmModule.forFeature([
      Categories,
      Courses,
      CourseContents,
      CourseContentSubs,
      CourseContentSubAssessmentQuestions,
      AssessmentAttempts,
      AssessmentResults,
    ]),
  ],
  controllers: [
    CoursesController,
    CourseContentsController,
    CourseContentSubsController,
    AssessmentController,
  ],
  providers: [
    CoursesService,
    CourseContentsService,
    CourseContentSubsService,
    CourseContentSubAssessmentQuestionsService,
    AssessmentAttemptsService,
    AssessmentResultsService,
    Courses,
    CourseContents,
    CourseContentSubs,
    CourseContentSubAssessmentQuestions,
    AssessmentAttempts,
    AssessmentResults,
  ],
  exports: [
    CoursesService,
    CourseContentSubsService,
    CourseContentSubAssessmentQuestionsService,
    AssessmentAttemptsService,
    AssessmentResultsService,
  ],
})
export class CoursesModule {}
