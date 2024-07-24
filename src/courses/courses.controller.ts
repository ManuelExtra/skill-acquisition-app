import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import {
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from 'src/generic/generic.payload';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { UserRole } from 'src/users/entities/user.entity';
import {
  AssessmentAttemptsService,
  CourseContentsService,
  CourseContentSubAssessmentQuestionsService,
  CourseContentSubsService,
  CoursesService,
} from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseContentDto } from './dto/create-course-content.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  AdditionalCoursePayload,
  CourseContents,
  CourseContentSubAssessmentQuestions,
  CourseContentSubs,
  Courses,
  IAssessmentAttempt,
  ICourse,
  ICourseContent,
  ICourseContentSub,
  ICourseContentSubAssessmentQuestion,
} from './entities/course.entity';
import { UpdateCourseContentDto } from './dto/update-course-content.dto';
import { CreateCourseContentSubDto } from './dto/create-course-content-sub.dto';
import { Public } from 'src/auth/decorators/auth.decorator';
import { UpdateCourseContentSubDto } from './dto/update-course-content-sub.dto';
import { CreateAssessmentQuestionDto } from './dto/create-assessment-question.dto';
import { UpdateAssessmentQuestionDto } from './dto/update-assessment-question.dto';
import { CreateAssessmentAttemptsDto } from './dto/create-assessment-attempts.dto';
import { ChangeContentSubOrderDto } from './dto/change-content-sub-order.dto';

@Controller('v1/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * Create course endpoint
   * @param req
   * @param createCourseDto
   * @returns
   */
  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(
    @Request() req: AuthPayload,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<GenericPayload> {
    return this.coursesService.create(createCourseDto, req.user);
  }

  /**
   * Get courses endpoint
   * @param filter
   * @returns
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query() filter: GenericFilter & ICourse,
  ): Promise<PagePayload<Courses>> {
    return this.coursesService.findAll(filter);
  }

  /**
   * Get courses endpoint for student
   * @param filter
   * @returns
   */
  @Get('fetch-courses')
  @Roles(UserRole.STUDENT)
  fetchCourses(
    @Query() filter: GenericFilter & ICourse,
  ): Promise<PagePayload<Courses>> {
    return this.coursesService.fetchCourses(filter);
  }

  /**
   * Get courses endpoint for instructor
   * @param req
   * @param filter
   * @returns
   */
  @Get('instructor')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findAllForInstructor(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & ICourse,
  ): Promise<PagePayload<Courses>> {
    return this.coursesService.findAllForInstructor(req.user, filter);
  }

  /**
   * Get a course endpoint
   * @param courseIdDto
   * @returns
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param() courseIdDto: IdDto): Promise<Courses | null> {
    return this.coursesService.findOne(courseIdDto['id']);
  }

  /**
   * Get a course endpoint or instructor
   * @param req
   * @param courseIdDto
   * @returns
   */
  @Get('instructor/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findOneForInstructor(
    @Request() req: AuthPayload,
    @Param() courseIdDto: IdDto,
  ): Promise<Courses | null> {
    return this.coursesService.findOneForInstructor(
      req.user,
      courseIdDto['id'],
    );
  }

  /**
   * Update a course endpoint
   * @param courseIdDto
   * @param updateCourseDto
   * @returns
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param() courseIdDto: IdDto,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<GenericPayload> {
    return this.coursesService.update(courseIdDto, updateCourseDto);
  }

  /**
   * Update a course endpoint for an instructor
   * @param req
   * @param courseIdDto
   * @param updateCourseDto
   * @returns
   */
  @Patch('instructor/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  updateForInstructor(
    @Request() req: AuthPayload,
    @Param() courseIdDto: IdDto,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<GenericPayload> {
    return this.coursesService.updateForInstructor(
      req.user,
      courseIdDto,
      updateCourseDto,
    );
  }

  /**
   * Delete a course endpoint
   * @param courseIdDto
   * @returns
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  remove(@Param() courseIdDto: IdDto): Promise<GenericPayload> {
    return this.coursesService.remove(courseIdDto);
  }
}

@Controller('v1/course-content')
export class CourseContentsController {
  constructor(private readonly courseContentsService: CourseContentsService) {}

  /**
   * Create course content endpoint
   * @param req
   * @param createCourseContentDto
   * @returns
   */
  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(
    @Request() req: AuthPayload,
    @Body() createCourseContentDto: CreateCourseContentDto,
  ): Promise<GenericPayloadAlias<{ id: CourseContents['id'] }>> {
    return this.courseContentsService.createCourseContent(
      req.user,
      createCourseContentDto,
    );
  }

  /**
   * Get course contents endpoint
   * @param filter
   * @param courseContentIdDto
   * @returns
   */
  @Get('by-course/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findAll(
    @Query() filter: GenericFilter & ICourse,
    @Param() courseContentIdDto: IdDto,
    @Request() req: AuthPayload,
  ): Promise<PagePayload<CourseContents>> {
    return this.courseContentsService.findAllContents(
      filter,
      courseContentIdDto,
      req.user,
    );
  }

  /**
   * Get a course content endpoint
   * @param courseContentIdDto
   * @returns
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findOne(
    @Param() courseContentIdDto: IdDto,
    @Request() req: AuthPayload,
  ): Promise<CourseContents | null> {
    return this.courseContentsService.findOneContent(
      courseContentIdDto['id'],
      req.user,
    );
  }

  /**
   * Get a course with contents and subs endpoint (omit media)
   * @param courseIdDto
   * @returns
   */
  @Get('public/:id')
  @Public()
  findOnePublic(@Param() courseIdDto: IdDto) {
    return this.courseContentsService.findOneCourseWithContentsAndSubs(
      courseIdDto,
    );
  }

  /**
   * Update a course content endpoint
   * @param courseContentIdDto
   * @param UpdateCourseContentDto
   * @returns
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  update(
    @Param() courseContentIdDto: IdDto,
    @Body() updateCourseContentDto: UpdateCourseContentDto,
  ): Promise<GenericPayload> {
    return this.courseContentsService.updateContent(
      courseContentIdDto,
      updateCourseContentDto,
    );
  }

  /**
   * Delete a course content endpoint
   * @param courseContentIdDto
   * @returns
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  remove(@Param() courseContentIdDto: IdDto): Promise<GenericPayload> {
    return this.courseContentsService.removeContent(courseContentIdDto);
  }
}

@Controller('v1/course-content-sub')
export class CourseContentSubsController {
  constructor(
    private readonly courseContentSubsService: CourseContentSubsService,
  ) {}

  /**
   * Create course content sub endpoint
   * @param req
   * @param createCourseContentSubDto
   * @returns
   */
  @Post('create')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(
    @Request() req: AuthPayload,
    @Body() createCourseContentSubDto: CreateCourseContentSubDto,
  ): Promise<GenericPayload> {
    return this.courseContentSubsService.createCourseContentSub(
      createCourseContentSubDto,
      req.user,
    );
  }

  /**
   * Get course content subs endpoint
   * @param filter
   * @param courseContentIdDto
   * @param req
   * @returns
   */
  @Get('by-course-content/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findAll(
    @Query() filter: GenericFilter & ICourseContentSub,
    @Param() courseContentIdDto: IdDto,
    @Request() req: AuthPayload,
  ): Promise<PagePayload<CourseContentSubs>> {
    return this.courseContentSubsService.findAllContentSubs(
      filter,
      courseContentIdDto,
      req.user,
    );
  }

  /**
   * Get a course content sub endpoint
   * @param courseContentSubIdDto
   * @param req
   * @returns
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findOne(
    @Param() courseContentSubIdDto: IdDto,
    @Request() req: AuthPayload,
  ): Promise<CourseContentSubs | null> {
    return this.courseContentSubsService.findOneContentSub(
      courseContentSubIdDto['id'],
      req.user,
    );
  }

  /**
   * Update a course content sub endpoint
   * @param courseContentSubIdDto
   * @param UpdateCourseContentSubDto
   * @returns
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  update(
    @Param() courseContentSubIdDto: IdDto,
    @Body() updateCourseContentSubDto: UpdateCourseContentSubDto,
  ): Promise<GenericPayload> {
    return this.courseContentSubsService.updateContentSub(
      courseContentSubIdDto,
      updateCourseContentSubDto,
    );
  }

  /**
   * Update a course content sub endpoint for instructor
   * @param courseContentSubIdDto
   * @param UpdateCourseContentSubDto
   * @returns
   */
  @Patch('instructor/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  updateForInstructor(
    @Request() req: AuthPayload,
    @Param() courseContentSubIdDto: IdDto,
    @Body() updateCourseContentSubDto: UpdateCourseContentSubDto,
  ): Promise<GenericPayload> {
    return this.courseContentSubsService.updateContentSubForInstructor(
      req.user,
      courseContentSubIdDto,
      updateCourseContentSubDto,
    );
  }

  /**
   * Delete a course content sub endpoint
   * @param courseContentSubIdDto
   * @returns
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  remove(@Param() courseContentSubIdDto: IdDto): Promise<GenericPayload> {
    return this.courseContentSubsService.removeContentSub(
      courseContentSubIdDto,
    );
  }

  /**
   * Change course order
   * @param req
   * @param courseContentIdDto
   * @param changeContentSubOrderDto
   * @returns
   */
  @Post('reorder')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  changeOrder(
    @Request() req: AuthPayload,
    @Body() changeContentSubOrderDto: ChangeContentSubOrderDto,
  ): Promise<GenericPayload> {
    return this.courseContentSubsService.changeContentSub(
      req.user,
      changeContentSubOrderDto,
    );
  }
}

@Controller('v1/assessments')
export class AssessmentController {
  constructor(
    private readonly assessmentQuestionsService: CourseContentSubAssessmentQuestionsService,
    private readonly assessmentAttemptsService: AssessmentAttemptsService,
  ) {}

  /**
   * Create assessment questions endpoint
   * @param req
   * @param createCourseContentSubDto
   * @returns
   */
  @Post('add-question')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  addQuestion(
    @Request() req: AuthPayload,
    @Body() createAssessmentQuestionDto: CreateAssessmentQuestionDto,
  ): Promise<GenericPayload> {
    return this.assessmentQuestionsService.addQuestion(
      createAssessmentQuestionDto,
    );
  }

  /**
   * Get assessment question endpoint
   * @param filter
   * @param courseContentSubIdDto
   * @returns
   */
  @Get('fetch-questions/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findAll(
    @Request() req: AuthPayload & Request,
    @Query() filter: GenericFilter & ICourseContentSubAssessmentQuestion,
    @Param() courseContentSubIdDto: IdDto,
  ): Promise<PagePayload<CourseContentSubAssessmentQuestions>> {
    return this.assessmentQuestionsService.findAllContentSubAssessmentQuestions(
      filter,
      courseContentSubIdDto,
      req.user,
    );
  }

  /**
   * Get single question endpoint
   * @param assessmentQuestionIdDto
   * @returns
   */
  @Get('single-question/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  getQuestion(
    @Param() assessmentQuestionIdDto: IdDto,
  ): Promise<CourseContentSubAssessmentQuestions | null> {
    return this.assessmentQuestionsService.findOneAssessmentQuestion(
      assessmentQuestionIdDto['id'],
    );
  }

  /**
   * Update assessment question endpoint
   * @param assessmentQuestionIdDto
   * @param UpdateAssessmentQuestionDto
   * @returns
   */
  @Patch('question/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  update(
    @Param() assessmentQuestionIdDto: IdDto,
    @Body() updateAssessmentQuestionDto: UpdateAssessmentQuestionDto,
  ): Promise<GenericPayload> {
    return this.assessmentQuestionsService.updateAssessmentQuestion(
      assessmentQuestionIdDto,
      updateAssessmentQuestionDto,
    );
  }

  /**
   * Delete assessment question endpoint
   * @param assessmentQuestionIdDto
   * @returns
   */
  @Delete('question/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  remove(@Param() assessmentQuestionIdDto: IdDto): Promise<GenericPayload> {
    return this.assessmentQuestionsService.removeAssessmentQuestion(
      assessmentQuestionIdDto,
    );
  }
}
