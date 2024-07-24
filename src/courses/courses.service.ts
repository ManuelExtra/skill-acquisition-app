import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto, IdDtoAlias } from 'src/generic/dto/generic.dto';
import {
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from 'src/generic/generic.payload';
import {
  GenericFilter,
  SortOrder,
} from 'src/generic/pagination/generic-filter';
import { PageService } from 'src/generic/pagination/page.service';
import { DataSource, In, Like, Not, QueryRunner, Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseContentDto } from './dto/create-course-content.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  AdditionalCoursePayload,
  AssessmentAttempts,
  AssessmentResultPayload,
  AssessmentResults,
  CourseContents,
  CourseContentSubAssessmentQuestions,
  CourseContentSubMediaTypes,
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
import { UpdateCourseContentSubDto } from './dto/update-course-content-sub.dto';
import { CreateAssessmentQuestionDto } from './dto/create-assessment-question.dto';
import { UpdateAssessmentQuestionDto } from './dto/update-assessment-question.dto';
import { CreateAssessmentAttemptsDto } from './dto/create-assessment-attempts.dto';
import { ChangeContentSubOrderDto } from './dto/change-content-sub-order.dto';
import { CreateAssessmentResultDto } from './dto/create-assessment-result.dto';
import { UserRole } from 'src/users/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CategoriesService } from 'src/categories/categories.service';

/**
 * Courses logic
 */
@Injectable()
export class CoursesService extends PageService {
  constructor(
    @InjectRepository(Courses)
    protected coursesRepository: Repository<Courses>,
    protected readonly courses: Courses,
    protected readonly categoriesService: CategoriesService,
  ) {
    super();
  }

  /**
   * A private method for creating a course where query
   * @param params
   * @returns
   */
  private createCourseWhereQuery(params: ICourse) {
    const where: any = {};

    if (params.title) {
      where.title = Like(`%${params.title}%`);
    }

    if (params.price) {
      where.price = params.price;
    }

    if (params.instructor) {
      where.instructor = {
        firstName: params.instructor.firstName,
        lastName: params.instructor.lastName,
        email: params.instructor.email,
        role: params.instructor.role,
      };
    }

    if (params.category) {
      where.category = {
        id: params.category.id,
      };
    }

    return where;
  }

  /**
   * Create course
   * @param createCourseDto
   * @param data
   * @returns
   */
  async create(
    createCourseDto: CreateCourseDto,
    data: AuthPayload['user'],
  ): Promise<GenericPayloadAlias<{ id: Courses['id'] }>> {
    const { title, category } = createCourseDto;

    // Check category
    await this.categoriesService.findOne(category);

    // Check course by title
    const savedCourse = await this.coursesRepository.findOne({
      where: {
        title,
        // @ts-ignore
        category: { id: category },
      },
    });

    if (savedCourse) {
      throw new UnprocessableEntityException(
        `Course with this title '${title}' already exists.`,
      );
    }

    const course = this.courses.create(createCourseDto, {
      id: data.sub,
    } as IdDto);

    await this.coursesRepository.save(course);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Course created successfully',
      data: { id: course.id },
    };
  }

  /**
   * Get courses
   * @param filter
   * @returns
   */
  async findAll(
    filter: GenericFilter & ICourse,
  ): Promise<PagePayload<Courses>> {
    const { ...params } = filter;

    const select = {
      // @ts-ignore
      category: {
        id: true,
        title: true,
      },
      // @ts-ignore
      instructor: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    };

    const relations = ['category', 'instructor'];

    const [results, total] = await this.paginateRelWithSelect(
      this.coursesRepository,
      filter,
      this.createCourseWhereQuery(params),
      relations,
      select,
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get courses for students
   * @param filter
   * @returns
   */
  async fetchCourses(
    filter: GenericFilter & ICourse,
  ): Promise<PagePayload<Courses>> {
    const { ...params } = filter;

    const select = {
      // @ts-ignore
      category: {
        id: true,
        title: true,
      },
    };

    const where = {
      ...this.createCourseWhereQuery(params),
      isPublished: true,
    };

    const [results, total] = await this.paginateRelWithSelect(
      this.coursesRepository,
      filter,
      where,
      ['category'],
      select,
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get courses for instructor
   * @param data
   * @param filter
   * @returns
   */
  async findAllForInstructor(
    data: AuthPayload['user'],
    filter: GenericFilter & ICourse,
  ): Promise<PagePayload<Courses>> {
    const { ...params } = filter;

    const select = {
      // @ts-ignore
      category: {
        id: true,
        title: true,
      },
    };

    const where = {
      ...this.createCourseWhereQuery(params),
      instructor: {
        id: data.sub,
      },
    };

    const [results, total] = await this.paginateRelWithSelect(
      this.coursesRepository,
      filter,
      where,
      ['category'],
      select,
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get a course
   * @param id
   * @param userId
   * @returns
   */
  async findOne(
    id: IdDto['id'],
    user?: Pick<AuthPayload['user'], 'role' | 'sub'>,
  ): Promise<Courses | null> {
    const where = { id };

    if (user) {
      if (user.role === UserRole.INSTRUCTOR) {
        // @ts-ignore
        where.instructor = { id: user.sub };
      }
    }

    const course = await this.coursesRepository.findOne({
      where,
      relations: ['instructor', 'category', 'contents.courseContentSubs'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  /**
   * Get a published course
   * @param id
   * @returns
   */
  async findOnePublished(id: IdDto['id']): Promise<Courses | null> {
    const course = await this.coursesRepository.findOne({
      where: { id, isPublished: true },
    });

    if (!course) {
      throw new NotFoundException('Course not available');
    }

    return course;
  }

  /**
   * Get a published course [with transaction]
   * @param id
   * @returns
   */
  async findOnePublishedWithTransaction(
    id: IdDto['id'],
    queryRunner: QueryRunner,
  ): Promise<Courses | null> {
    const course = await queryRunner.manager.findOne(Courses, {
      where: { id, isPublished: true },
    });

    if (!course) {
      throw new NotFoundException('Course not available');
    }

    return course;
  }

  /**
   * Get a course for instructor
   * @param data
   * @param id
   * @returns
   */
  async findOneForInstructor(
    data: AuthPayload['user'],
    id: IdDto['id'],
  ): Promise<Courses | null> {
    const course = await this.coursesRepository.findOne({
      where: {
        id,
        // @ts-ignore
        instructor: { id: data.sub },
      },
      relations: ['instructor', 'category', 'contents.courseContentSubs'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  /**
   * Update course for admin
   * @param courseIdDto
   * @param updateCourseDto
   * @returns
   */
  async update(
    courseContentIdDto: IdDto,
    updateCourseDto: UpdateCourseDto,
  ): Promise<GenericPayload> {
    const { id } = courseContentIdDto;

    // Check course
    const course = await this.findOne(id);

    Object.keys(updateCourseDto).forEach((item) => {
      course[item] = updateCourseDto[item];
    });

    await this.coursesRepository.save(course);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course updated successfully.',
    };
  }

  /**
   * Update course for instructor
   * @param data
   * @param courseIdDto
   * @param updateCourseDto
   * @returns
   */
  async updateForInstructor(
    data: AuthPayload['user'],
    courseIdDto: IdDto,
    updateCourseDto: UpdateCourseDto,
  ): Promise<GenericPayload> {
    const { id } = courseIdDto;
    const { title, shortDesc, fullDesc, price, discount } = updateCourseDto;

    // Check course
    const course = await this.findOneForInstructor(data, id);

    // Has course been published?
    if (course.isPublished) {
      throw new ForbiddenException(
        'Permission error. A published course cannot be modified',
      );
    }

    // Accepted data
    const acceptedData = { title, shortDesc, fullDesc, price, discount };

    Object.keys(acceptedData).forEach((item) => {
      course[item] = acceptedData[item];
    });

    await this.coursesRepository.save(course);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course updated successfully.',
    };
  }

  /**
   * Delete a course (unpublished only)
   * @param courseIdDto
   * @returns
   */
  async remove(courseIdDto: IdDto): Promise<GenericPayload> {
    const { id } = courseIdDto;
    const course = await this.findOne(id);

    if (course.isPublished) {
      throw new UnprocessableEntityException(
        'Course published cannot be deleted.',
      );
    }

    await this.coursesRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Course removed successfully.',
    };
  }
}

/**
 * Course contents logic
 */
@Injectable()
export class CourseContentsService extends CoursesService {
  constructor(
    @InjectRepository(CourseContents)
    protected courseContentsRepository: Repository<CourseContents>,
    protected readonly courseContents: CourseContents,

    @InjectRepository(Courses)
    protected coursesRepository: Repository<Courses>,
    protected readonly courses: Courses,

    protected readonly categoriesService: CategoriesService,
  ) {
    super(coursesRepository, courses, categoriesService);
  }

  /**
   * A private method for creating a course content where query
   * @param params
   * @returns
   */
  private createCourseContentWhereQuery(params: ICourseContent) {
    const where: any = {};

    if (params.title) {
      where.title = Like(`%${params.title}%`);
    }

    if (params.course) {
      where.course = {
        title: Like(`%${params.course.title}%`),
      };
    }

    return where;
  }

  /**
   * Create course content
   * @param createCourseContentDto
   * @returns
   */
  async createCourseContent(
    data: AuthPayload['user'],
    createCourseContentDto: CreateCourseContentDto,
  ): Promise<GenericPayloadAlias<{ id: CourseContents['id'] }>> {
    const { title, course } = createCourseContentDto;

    // Check course
    await this.findOneForInstructor(data, course);

    // Check course content by title
    const savedCourseContent = await this.courseContentsRepository.findOne({
      where: {
        title,
        // @ts-ignore
        course: { id: course },
      },
    });

    if (savedCourseContent) {
      throw new UnprocessableEntityException(
        `Course content with this title '${title}' already exists.`,
      );
    }

    const courseContent = this.courseContents.create(createCourseContentDto);

    await this.courseContentsRepository.save(courseContent);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Course content created successfully',
      data: { id: courseContent.id },
    };
  }

  /**
   * Get course contents
   * @param filter
   * @param courseIdDto
   * @param userDto
   * @returns
   */
  async findAllContents(
    filter: GenericFilter & ICourseContent,
    courseIdDto: IdDto,
    userDto?: AuthPayload['user'],
  ): Promise<PagePayload<CourseContents>> {
    const { ...params } = filter;
    const { id } = courseIdDto;

    // Check course
    await this.findOne(id, userDto);

    const where = {
      ...this.createCourseContentWhereQuery(params),
      course: { id },
    };

    const [results, total] = await this.paginate(
      this.courseContentsRepository,
      filter,
      where,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get a course content
   * @param id
   * @param user
   * @returns
   */
  async findOneContent(
    id: IdDto['id'],
    user?: Pick<AuthPayload['user'], 'role' | 'sub'>,
  ): Promise<CourseContents | null> {
    const where = { id };

    if (user) {
      if (user.role === UserRole.INSTRUCTOR) {
        // @ts-ignore
        where.course = { instructor: { id: user.sub } };
      }
    }

    const courseContent = await this.courseContentsRepository.findOne({
      where,
      relations: ['course'],
    });

    if (!courseContent) {
      throw new NotFoundException('Course content not found');
    }
    return courseContent;
  }

  /**
   * Get a course with contents and subs
   * @param courseIdDto
   * @returns
   */
  async findOneCourseWithContentsAndSubs(courseIdDto: IdDto) {
    const { id } = courseIdDto;

    // Check course
    const course = await this.findOne(id);

    if (!course.isPublished) {
      throw new ForbiddenException('Course not available for preview');
    }

    // Get Course total duration
    const courseContentSubsTotalDuration = await this.courseContentsRepository
      .createQueryBuilder('courseContent')
      .innerJoinAndSelect(
        'courseContent.courseContentSubs',
        'courseContentSubs',
      )
      .where('courseContent.course.id = :id', { id: course.id })
      .select(['SUM(courseContentSubs.duration) as totalDuration'])
      .orderBy('courseContentSubs.createdDate', 'ASC')
      .getRawOne();

    // get content with subs
    const courseContentswithSubs =
      await this.courseContentsRepository.findAndCount({
        // @ts-ignore
        select: {
          title: true,
          courseContentSubs: {
            title: true,
            duration: true,
            previewUrl: true,
            mediaType: true,
          },
        },
        // @ts-ignore
        where: { course: { id: course.id } },
        relations: {
          courseContentSubs: true,
        },
        order: {
          courseContentSubs: {
            order: 'ASC',
          },
        },
      });

    // Remove content in course obj
    delete course.contents;

    // Formatted prices
    const {
      originalPriceFormat,
      discountPriceFormat,
      discountedPrice,
      discountFormat,
    } = course.getFormattedPrices();

    course['originalPriceFormat'] = originalPriceFormat;
    course['discountPriceFormat'] = discountPriceFormat;
    course['discountedPrice'] = discountedPrice;
    course['discountFormat'] = discountFormat;

    return {
      course: course.client() as Courses & AdditionalCoursePayload,
      contents: {
        data: courseContentswithSubs[0],
        total: courseContentswithSubs[1],
        totalDuration: +courseContentSubsTotalDuration['totalDuration'],
      },
    };
  }

  /**
   * Get a course with contents and subs (include media)
   * @param courseIdDto
   * @returns
   */
  async findOneCourseWithContentsAndSubsVerified(
    user: AuthPayload['user'],
    courseIdDto: IdDto,
  ) {
    const { id } = courseIdDto;

    // Check course
    const course = await this.findOne(id);

    if (!course.isPublished) {
      throw new ForbiddenException('Course not available for preview');
    }

    // Get total duration
    const courseContentSubsTotalDuration = await this.courseContentsRepository
      .createQueryBuilder('courseContent')
      .innerJoinAndSelect(
        'courseContent.courseContentSubs',
        'courseContentSubs',
      )
      .where('courseContent.course.id = :id', { id: course.id })
      .select(['SUM(courseContentSubs.duration) as totalDuration'])
      .orderBy('courseContentSubs.createdDate', 'ASC')
      .getRawOne();

    // get content with subs
    const courseContentswithSubs =
      await this.courseContentsRepository.findAndCount({
        // @ts-ignore
        select: {
          title: true,
          courseContentSubs: {
            id: true,
            title: true,
            duration: true,
            previewUrl: true,
            media: true,
            mediaType: true,
          },
        },
        // @ts-ignore
        where: { course: { id: course.id } },
        relations: {
          courseContentSubs: true,
        },
        order: {
          courseContentSubs: {
            order: 'ASC',
          },
        },
      });

    // Remove content in course obj [unwanted data]
    delete course.contents;

    // Formatted prices
    const {
      originalPriceFormat,
      discountPriceFormat,
      discountedPrice,
      discountFormat,
    } = course.getFormattedPrices();

    course['originalPriceFormat'] = originalPriceFormat;
    course['discountPriceFormat'] = discountPriceFormat;
    course['discountedPrice'] = discountedPrice;
    course['discountFormat'] = discountFormat;

    return {
      course: course.client() as Courses & AdditionalCoursePayload,
      contents: {
        data: courseContentswithSubs[0],
        total: courseContentswithSubs[1],
        totalDuration: +courseContentSubsTotalDuration['totalDuration'],
      },
    };
  }

  /**
   * Get a course content with subs
   * @param id
   * @returns
   */
  async findOneContentWithSubs(
    id: IdDto['id'],
  ): Promise<CourseContents | null> {
    const courseContent = await this.courseContentsRepository.findOne({
      where: { id },
      relations: ['courseContentSubs'],
    });

    if (!courseContent) {
      throw new NotFoundException('Course content not found');
    }
    return courseContent;
  }

  /**
   * Update course content
   * @param courseContentIdDto
   * @param updateCourseContentDto
   * @returns
   */
  async updateContent(
    courseContentIdDto: IdDto,
    updateCourseContentDto: UpdateCourseContentDto,
  ): Promise<GenericPayload> {
    const { id } = courseContentIdDto;

    // Check course content
    const courseContent = await this.findOneContent(id);

    // Remove course key
    delete updateCourseContentDto.course;

    Object.keys(updateCourseContentDto).forEach((item) => {
      courseContent[item] = updateCourseContentDto[item];
    });

    await this.courseContentsRepository.save(courseContent);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course content updated successfully.',
    };
  }

  /**
   * Delete a course content
   * @param courseContentIdDto
   * @returns
   */
  async removeContent(courseContentIdDto: IdDto): Promise<GenericPayload> {
    const { id } = courseContentIdDto;

    // Check course content
    const courseContent = await this.findOneContent(id);

    // Check course
    // @ts-ignore
    const course = await this.findOne(courseContent.course.id as IdDto['id']);

    if (course.isPublished) {
      throw new UnprocessableEntityException(
        'This course content cannot be deleted because it has been published.',
      );
    }

    await this.courseContentsRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Course content removed successfully.',
    };
  }
}

/**
 * Course content subs logic
 */
@Injectable()
export class CourseContentSubsService extends CourseContentsService {
  constructor(
    @InjectRepository(CourseContentSubs)
    protected courseContentSubsRepository: Repository<CourseContentSubs>,
    protected readonly courseContentSubs: CourseContentSubs,

    @InjectRepository(CourseContents)
    protected courseContentsRepository: Repository<CourseContents>,
    protected readonly courseContents: CourseContents,

    @InjectRepository(Courses)
    protected coursesRepository: Repository<Courses>,
    protected readonly courses: Courses,
    protected readonly categoriesService: CategoriesService,
  ) {
    super(
      courseContentsRepository,
      courseContents,
      coursesRepository,
      courses,
      categoriesService,
    );
  }

  /**
   * A private method for creating a course content sub where query
   * @param params
   * @returns
   */
  private createCourseContentSubWhereQuery(params: ICourseContentSub) {
    const where: any = {};

    if (params.title) {
      where.title = Like(`%${params.title}%`);
    }

    if (params.course) {
      where.course = {
        title: Like(`%${params.course.title}%`),
      };
    }

    if (params.courseContent) {
      where.courseContent = {
        title: Like(`%${params.courseContent.title}%`),
      };
    }

    return where;
  }

  /**
   * Get course order number for numeric sequence
   * @param courseId
   * @param courseContentId
   * @returns
   */
  private async getCourseOrderNumber(
    courseId?: string,
    courseContentId?: string,
  ): Promise<number> {
    let order = 1;

    const where = {
      course: { id: courseId },
      courseContent: { id: courseContentId },
    };

    // Get latest courses
    const courses = await this.courseContentSubsRepository.find({
      // @ts-ignore
      where,
      order: { createdDate: 'DESC' },
    });

    // Check if course exists
    if (Boolean(courses.length)) {
      order = courses[0].order + 1;
    }
    return order;
  }

  /**
   * Create course content sub
   * @param createCourseContentSubDto
   * @param user
   * @returns
   */
  async createCourseContentSub(
    createCourseContentSubDto: CreateCourseContentSubDto,
    user?: AuthPayload['user'],
  ): Promise<GenericPayload> {
    const { title, course, courseContent } = createCourseContentSubDto;

    // Check course
    await this.findOne(course, user);

    // Check course content
    await this.findOneContent(courseContent, user);

    // Collect and prepare data
    const courseContentSub = this.courseContentSubs.create(
      createCourseContentSubDto,
    );

    // Check course content sub by title
    const savedCourseContentSub =
      await this.courseContentSubsRepository.findOne({
        where: {
          title,
          // @ts-ignore
          course: { id: course },
          // @ts-ignore
          courseContent: { id: courseContent },
        },
      });

    if (savedCourseContentSub) {
      throw new UnprocessableEntityException(
        `Course content sub with this title '${title}' already exists.`,
      );
    }

    // Add up order number for this new course
    courseContentSub.order = await this.getCourseOrderNumber(
      course,
      courseContent,
    );

    // Save course
    await this.courseContentSubsRepository.insert(courseContentSub);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Course content sub created successfully',
    };
  }

  /**
   * Get course content subs
   * @param filter
   * @param courseContentIdDto
   * @param user
   * @returns
   */
  async findAllContentSubs(
    filter: GenericFilter & ICourseContentSub,
    courseContentIdDto: IdDto,
    user?: AuthPayload['user'],
  ): Promise<PagePayload<CourseContentSubs>> {
    const { ...params } = filter;
    const { id } = courseContentIdDto;

    // Check course content
    await this.findOneContent(id, user);

    const where = {
      ...this.createCourseContentSubWhereQuery(params),
      courseContent: { id },
    };

    const [results, total] = await this.paginate(
      this.courseContentSubsRepository,
      filter,
      where,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get number of course content subs (An utility method)
   * @param filter
   * @param courseContentIdDto
   * @param not
   * @returns
   */
  async fetchContentSubsCount(
    id: IdDto['id'],
    mediaType: CourseContentSubMediaTypes,
    not: boolean,
  ): Promise<number> {
    const where = {
      course: { id },
      mediaType: not ? Not(mediaType) : mediaType,
    };

    // @ts-ignore
    const total = await this.courseContentSubsRepository.count({ where });

    return total;
  }

  /**
   * Get a course content sub
   * @param id
   * @param user
   * @returns
   */
  async findOneContentSub(
    id: IdDto['id'],
    user?: Pick<AuthPayload['user'], 'sub' | 'role'>,
  ): Promise<CourseContentSubs | null> {
    const where = { id };

    if (user) {
      if (user.role === UserRole.INSTRUCTOR) {
        // @ts-ignore
        where.course = { instructor: { id: user.sub } };
      }
    }

    const courseContentSub = await this.courseContentSubsRepository.findOne({
      where,
      relations: ['course', 'courseContent'],
    });

    if (!courseContentSub) {
      throw new NotFoundException('Course content sub not found');
    }
    return courseContentSub;
  }

  /**
   * Get a course content sub for instructor
   * @param data
   * @param id
   * @returns
   */
  async findOneContentSubForInstructor(
    data: AuthPayload['user'],
    id: IdDto['id'],
  ): Promise<CourseContentSubs | null> {
    const courseContentSub = await this.courseContentSubsRepository.findOne({
      where: { id },
      relations: ['course.instructor', 'courseContent'],
    });

    // @ts-ignore
    if (courseContentSub.course.instructor?.id !== data.sub) {
      throw new ForbiddenException();
    }

    if (!courseContentSub) {
      throw new NotFoundException('Course content sub not found');
    }
    return courseContentSub;
  }

  /**
   * Update course content sub
   * @param courseContentSubIdDto
   * @param updateCourseContentSubDto
   * @returns
   */
  async updateContentSub(
    courseContentSubIdDto: IdDto,
    updateCourseContentSubDto: UpdateCourseContentSubDto,
  ): Promise<GenericPayload> {
    const { id } = courseContentSubIdDto;

    // Check course content sub
    const courseContentSub = await this.findOneContentSub(id);

    // Remove course key
    delete updateCourseContentSubDto.course;

    // Remove course content key
    delete updateCourseContentSubDto.courseContent;

    Object.keys(updateCourseContentSubDto).forEach((item) => {
      courseContentSub[item] = updateCourseContentSubDto[item];
    });

    await this.courseContentSubsRepository.save(courseContentSub);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course content sub updated successfully.',
    };
  }

  /**
   * Update course content sub for instructor
   * @param courseContentSubIdDto
   * @param updateCourseContentSubDto
   * @returns
   */
  async updateContentSubForInstructor(
    data: AuthPayload['user'],
    courseContentSubIdDto: IdDto,
    updateCourseContentSubDto: UpdateCourseContentSubDto,
  ): Promise<GenericPayload> {
    const { id } = courseContentSubIdDto;

    // Check course content sub
    const courseContentSub = await this.findOneContentSubForInstructor(
      data,
      id,
    );

    // Remove course key
    delete updateCourseContentSubDto.course;

    // Remove course content key
    delete updateCourseContentSubDto.courseContent;

    Object.keys(updateCourseContentSubDto).forEach((item) => {
      courseContentSub[item] = updateCourseContentSubDto[item];
    });

    await this.courseContentSubsRepository.save(courseContentSub);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course content sub updated successfully.',
    };
  }

  /**
   * Change content sub order
   * @param data
   * @param courseContentIdDto
   * @param changeContentSubOrderDto
   * @returns
   */
  async changeContentSub(
    data: AuthPayload['user'],
    changeContentSubOrderDto: ChangeContentSubOrderDto,
  ): Promise<GenericPayload> {
    // Check course content
    const courseContent = this.courseContentSubsRepository.create(
      changeContentSubOrderDto.sequence,
    );

    // Save content sub
    await this.courseContentSubsRepository.upsert(
      changeContentSubOrderDto.sequence,
      {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['id'],
        upsertType: 'on-conflict-do-update',
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Course content sub order updated successfully.',
    };
  }

  /**
   * Delete a course content sub
   * @param courseContentSubIdDto
   * @returns
   */
  async removeContentSub(
    courseContentSubIdDto: IdDto,
  ): Promise<GenericPayload> {
    const { id } = courseContentSubIdDto;

    // Check course content sub
    const courseContentSub = await this.findOneContentSub(id);

    // Check course
    const course = await this.findOne(
      // @ts-ignore
      courseContentSub.course.id as IdDto['id'],
    );

    if (course.isPublished) {
      throw new UnprocessableEntityException(
        'This course content sub cannot be deleted because it has been published.',
      );
    }

    await this.courseContentSubsRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Course content sub removed successfully.',
    };
  }

  /**
   * Is content sub part of the course provided
   * @param courseId
   * @param contentSubId
   * @returns
   */
  async IsContentSubValid(
    courseId: string,
    contentSubId: string,
  ): Promise<boolean> {
    const isContentSubFound = await this.courseContentSubsRepository.exists({
      where: {
        // @ts-ignore
        course: { id: courseId },
        // @ts-ignore
        id: contentSubId,
      },
    });

    return isContentSubFound;
  }

  /**
   * Fetch content sub total number
   * @param courseId
   * @returns
   */
  async contentSubsNumber(courseId: string): Promise<number> {
    // Fetch total content sub
    const contentSubs = await this.courseContentSubsRepository.count({
      // @ts-ignore
      where: { course: { id: courseId } },
    });

    return contentSubs;
  }
}

/**
 * assessment question logic
 */
@Injectable()
export class CourseContentSubAssessmentQuestionsService extends CourseContentSubsService {
  constructor(
    @InjectRepository(CourseContentSubAssessmentQuestions)
    protected CourseContentSubAssessmentQuestionsRepository: Repository<CourseContentSubAssessmentQuestions>,
    protected readonly CourseContentSubAssessmentQuestions: CourseContentSubAssessmentQuestions,

    @InjectRepository(CourseContentSubs)
    protected courseContentSubsRepository: Repository<CourseContentSubs>,
    protected readonly courseContentSubs: CourseContentSubs,

    @InjectRepository(CourseContents)
    protected courseContentsRepository: Repository<CourseContents>,
    protected readonly courseContents: CourseContents,

    @InjectRepository(Courses)
    protected coursesRepository: Repository<Courses>,
    protected readonly courses: Courses,
    protected readonly categoriesService: CategoriesService,
  ) {
    super(
      courseContentSubsRepository,
      courseContentSubs,
      courseContentsRepository,
      courseContents,
      coursesRepository,
      courses,
      categoriesService,
    );
  }

  /**
   * A private method for creating a course content sub assessment where query
   * @param params
   * @returns
   */
  private createCourseContentSubAssessmentWhereQuery(
    params: ICourseContentSubAssessmentQuestion,
  ) {
    const where: any = {};

    if (params.question) {
      where.title = Like(`%${params.question}%`);
    }

    if (params.courseContentSub) {
      where.courseContent = {
        title: Like(`%${params.courseContentSub.title}%`),
      };
    }

    return where;
  }

  /**
   * Add assessment question
   * @param createCourseContentSubDto
   * @returns
   */
  async addQuestion(
    createAssessmentQuestionDto: CreateAssessmentQuestionDto,
  ): Promise<GenericPayload> {
    const { question, options, correctOption, courseContentSub } =
      createAssessmentQuestionDto;

    // Check course content sub
    const contentSub = await this.findOneContentSub(courseContentSub);

    // Collect and prepare assessment question data
    const assessmentQuestion = this.CourseContentSubAssessmentQuestions.create(
      createAssessmentQuestionDto,
    );

    // Check if contentSub is of the assessment type
    if (contentSub.mediaType !== CourseContentSubMediaTypes.ASSESSMENT) {
      throw new UnprocessableEntityException('Invalid course content type');
    }

    // Check assessment question
    const savedAssessmentQuestion =
      await this.CourseContentSubAssessmentQuestionsRepository.findOne({
        where: {
          question,
          // @ts-ignore
          courseContentSub: { id: courseContentSub },
        },
      });

    // Check correct option
    if (!Boolean(options[correctOption])) {
      throw new UnprocessableEntityException(
        'Index supplied for the correct option does not exist.',
      );
    }

    if (savedAssessmentQuestion) {
      throw new UnprocessableEntityException(
        `Assessment with this question '${question}' already exists.`,
      );
    }

    // Save assessment question
    await this.CourseContentSubAssessmentQuestionsRepository.save(
      assessmentQuestion,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Assessment question created successfully',
    };
  }

  /**
   * Get assessment questions
   * @param filter
   * @param courseContentSubIdDto
   * @returns
   */
  async findAllContentSubAssessmentQuestions(
    filter: GenericFilter & ICourseContentSubAssessmentQuestion,
    courseContentSubIdDto: IdDto,
    user?: AuthPayload['user'],
  ): Promise<PagePayload<CourseContentSubAssessmentQuestions>> {
    const { ...params } = filter;
    const { id } = courseContentSubIdDto;

    // Check course content sub
    await this.findOneContentSub(id);

    const where: CourseContentSubAssessmentQuestions = {
      ...this.createCourseContentSubAssessmentWhereQuery(params),
      courseContentSub: { id },
      isPublished: true,
    };

    const select = {
      id: true,
      question: true,
      options: true,
      point: true,
      correctOption: false,
      createdDate: true,
      isPublished: false,
    };

    // For modules invoking this method, if user value might be undefined, then it a student fetching the questions otherwise do the check.
    if (user) {
      if (user.role !== UserRole.STUDENT) {
        select.correctOption = true;
        select.isPublished = true;
        delete where.isPublished;
      }
    }

    const [results, total] = await this.paginateWithSelect(
      this.CourseContentSubAssessmentQuestionsRepository,
      filter,
      where,
      select,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get assessment questions for students that are authorized
   * @param filter
   * @param courseContentSubIdDto
   * @returns
   */
  async findAssessmentQuestionsForStudents(
    filter: GenericFilter & ICourseContentSubAssessmentQuestion,
    courseContentSubIdDto: IdDto,
  ): Promise<PagePayload<CourseContentSubAssessmentQuestions>> {
    const { ...params } = filter;
    const { id } = courseContentSubIdDto;

    // Check course content sub
    await this.findOneContentSub(id);

    // Filter assessment questions (published)
    const where = {
      ...this.createCourseContentSubAssessmentWhereQuery(params),
      courseContentSub: { id },
      isPublished: true,
    };

    // Execute the query
    const select = {
      id: true,
      question: true,
      options: true,
      createdDate: true,
    };
    const [results, total] = await this.paginateWithSelect(
      this.CourseContentSubAssessmentQuestionsRepository,
      filter,
      where,
      select,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Get an assessment question
   * @param id
   * @returns
   */
  async findOneAssessmentQuestion(
    id: IdDto['id'],
  ): Promise<CourseContentSubAssessmentQuestions | null> {
    const assessmentQuestion =
      await this.CourseContentSubAssessmentQuestionsRepository.findOne({
        where: { id },
        relations: ['courseContentSub.course'],
      });

    if (!assessmentQuestion) {
      throw new NotFoundException('Assessment question not found');
    }
    return assessmentQuestion;
  }

  /**
   * Update assessment question
   * @param assessmentQuestionIdDto
   * @param updateAssessmentQuestionDto
   * @returns
   */
  async updateAssessmentQuestion(
    assessmentQuestionIdDto: IdDto,
    updateAssessmentQuestionDto: UpdateAssessmentQuestionDto,
  ): Promise<GenericPayload> {
    const { id } = assessmentQuestionIdDto;

    const { options, correctOption } = updateAssessmentQuestionDto;

    // Check assessment question
    const assessmentQuestion = await this.findOneAssessmentQuestion(id);

    // Remove course content sub key
    delete updateAssessmentQuestionDto.courseContentSub;

    Object.keys(updateAssessmentQuestionDto).forEach((item) => {
      assessmentQuestion[item] = updateAssessmentQuestionDto[item];
    });

    // Check correct option index
    if (correctOption) {
      if (options) {
        if (!Boolean(options[correctOption])) {
          throw new UnprocessableEntityException(
            'Index supplied for the correct option does not exist.',
          );
        }
      } else {
        if (!Boolean(assessmentQuestion.options[correctOption])) {
          throw new UnprocessableEntityException(
            'Index supplied for the correct option does not exist.',
          );
        }
      }
    }

    await this.CourseContentSubAssessmentQuestionsRepository.save(
      assessmentQuestion,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Assessment question updated successfully.',
    };
  }

  /**
   * Delete assessment question
   * @param assessmentQuestionIdDto
   * @returns
   */
  async removeAssessmentQuestion(
    assessmentQuestionIdDto: IdDto,
  ): Promise<GenericPayload> {
    const { id } = assessmentQuestionIdDto;

    // Check assessment question
    const assessmentQuestion = await this.findOneAssessmentQuestion(id);

    if (assessmentQuestion.isPublished) {
      throw new UnprocessableEntityException(
        'This assessment question cannot be deleted because it has been published.',
      );
    }

    await this.CourseContentSubAssessmentQuestionsRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Assessment question removed successfully.',
    };
  }
}
@Injectable()
export class AssessmentResultsService extends PageService {
  constructor(
    @InjectRepository(AssessmentResults)
    protected assessmentResultsRepository: Repository<AssessmentResults>,
    protected readonly asessmentResults: AssessmentResults,
  ) {
    super();
  }

  /**
   * Create assessment result
   * @param createAssessmentResultDto
   */
  async createAssessmentResult(
    createAssessmentResultDto: CreateAssessmentResultDto,
    queryRunner: QueryRunner,
  ): Promise<AssessmentResults> {
    const { courseContentSub, student } = createAssessmentResultDto;

    // Delete former result
    await queryRunner.manager.delete(AssessmentResults, {
      courseContentSub,
      student,
    });

    // prepare result data for storage
    const assessmentResult = this.asessmentResults.create(
      createAssessmentResultDto,
    );

    // Store result
    await queryRunner.manager.insert(AssessmentResults, assessmentResult);

    // Fetch result details
    const result = await queryRunner.manager.findOne(AssessmentResults, {
      where: {
        // @ts-ignore
        student: { id: student },
        // @ts-ignore
        courseContentSub: { id: courseContentSub },
      },
      relations: ['student', 'courseContentSub.course.instructor'],
    });

    return result;
  }

  /**
   * Get assessment result
   * @param courseContentSubDto
   * @returns
   */
  async getAssessmentResult(
    courseContentSubDto: IdDto,
  ): Promise<AssessmentResults> {
    const { id } = courseContentSubDto;

    const result = await this.assessmentResultsRepository.findOne({
      // @ts-ignore
      where: { courseContentSub: { id } },
    });

    return result;
  }

  /**
   * Get assessment results
   * @param courseDto
   * @param studentId
   * @returns
   */
  async getAssessmentResults(
    courseDto: IdDto | IdDtoAlias,
    studentId?: string | undefined,
  ): Promise<AssessmentResults[]> {
    const { id } = courseDto;

    const where = {
      // @ts-ignore
      courseContentSub: { course: { id } },
    };
    if (studentId) {
      // @ts-ignore
      where.student = { id: studentId };
    }

    const results = await this.assessmentResultsRepository.find({
      // @ts-ignore
      where,
      relations: ['courseContentSub'],
    });

    return results;
  }

  /**
   * Get paginated assessment results
   * @param filter
   * @param courseId
   * @param studentId
   * @returns
   */
  async getPaginatedAssessmentResults(
    filter: GenericFilter,
    courseId: IdDto['id'] | IdDtoAlias['id'],
    studentId?: string | undefined,
  ): Promise<PagePayload<AssessmentResults>> {
    const { ...params } = filter;

    const relations = ['courseContentSub'];
    const select = [];

    const where = {
      // @ts-ignore
      courseContentSub: { course: { id: courseId } },
    };
    if (studentId) {
      // @ts-ignore
      where.student = { id: studentId };
    }

    const [results, total] =
      await this.paginateRelWithSelect<AssessmentResults>(
        this.assessmentResultsRepository,
        filter,
        where,
        relations,
        select,
      );

    return {
      data: results,
      count: total,
    };
  }
}

@Injectable()
export class AssessmentAttemptsService extends PageService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(AssessmentAttempts)
    protected assessmentAttemptsRepository: Repository<AssessmentAttempts>,
    protected readonly asessmentAttempts: AssessmentAttempts,

    @InjectRepository(AssessmentResults)
    protected assessmentResultsRepository: Repository<AssessmentResults>,

    protected readonly courseContentSubsService: CourseContentSubsService,
    protected readonly assessmentResultsService: AssessmentResultsService,

    protected readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  /**
   * A private method for creating an assessment attempt where query
   * @param params
   * @returns
   */
  private createAssessmentAttemptWhereQuery(params: IAssessmentAttempt) {
    const where: any = {};

    if (params.assessmentQuestion) {
      where.assessmentQuestion = {
        question: Like(`%${params.assessmentQuestion.question}%`),
      };
    }

    return where;
  }

  /**
   * Fetch and compute assessment result
   * @returns
   */
  private async computeAssessmentResult(
    queryRunner: QueryRunner,
  ): Promise<AssessmentResultPayload> {
    const pointQuery = await queryRunner.manager.query(
      `select SUM(point) from assessment_attempts inner join course_content_sub_assessment_questions where assessment_attempts.assessmentQuestionId=course_content_sub_assessment_questions.id and assessment_attempts.choice = course_content_sub_assessment_questions.correctOption;`,
    );

    const totalPointQuery = await queryRunner.manager.query(
      `select SUM(point) from assessment_attempts inner join course_content_sub_assessment_questions where assessment_attempts.assessmentQuestionId=course_content_sub_assessment_questions.id`,
    );

    const score = +pointQuery[0]['SUM(point)'];
    const total = +totalPointQuery[0]['SUM(point)'];
    const percent = (score / total) * 100;
    return {
      score,
      total,
      percent,
    };
  }

  private async IsStudentAuthorized(
    student: IdDto['id'],
    contentSub: IdDto['id'],
  ): Promise<boolean> {
    const assessmentAttempt = await this.assessmentAttemptsRepository.exists({
      where: {
        // @ts-ignore
        student: { id: student },
        assessmentQuestion: {
          // @ts-ignore
          courseContentSub: { id: contentSub },
        },
      },
    });

    return assessmentAttempt;
  }

  /**
   * Prepare assessment attempt bulk notification message for instructor, admin as an instructor, admin and subadmin
   * @param user
   * @param instructors
   * @returns
   */
  private prepareAssessmentAttemptNotificationMessage(
    user: { name: string },
    instructor: {
      id: string;
      name: string;
      role: UserRole;
      subContentTitle: string;
      courseTitle: string;
    },
  ) {
    // prepare notification body
    const instructorsMessage = {
      title: `Assessment attempt`,
      body: `${user.name} has attempted an assessment [${instructor.subContentTitle}] of your course [${instructor.courseTitle}]`,
      userGroup: instructor.role,
      user: instructor.id,
    };

    let adminMessage = null;
    if (instructor.role === UserRole.INSTRUCTOR) {
      adminMessage = {
        title: `Assessment attempt`,
        body: `${user.name} has attempted an assessment [${instructor.subContentTitle}] of the course [${instructor.courseTitle}] created by ${instructor.name} [${instructor.role}]`,
        userGroup: UserRole.ADMIN,
      };
    }

    const subadminMessage = {
      title: `Assessment attempt`,
      body: `${user.name} has attempted an assessment [${instructor.subContentTitle}] of the course [${instructor.courseTitle}] created by ${instructor.name} [${instructor.role}]`,
      userGroup: UserRole.SUBADMIN,
    };

    // Bring them together
    const bulkMessage = [
      instructorsMessage,
      adminMessage,
      subadminMessage,
    ].filter((val) => val !== null);

    return bulkMessage;
  }

  /**
   * Invoke prepareAssessmentAttemptNotificationMessage() and send bulk notification
   * @param assessmentResult
   * @param queryRunner
   */
  private async sendAssessmentAttemptBulkNotification(
    assessmentResult: {
      student: { firstName: string; lastName: string };
      subContent: {
        title: string;
        course: {
          title: string;
          instructor: {
            id: string;
            role: UserRole;
            firstName: string;
            lastName: string;
          };
        };
      };
    },
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Prepare notification messages (bulk)
    const notificationUserParam = {
      // @ts-ignore
      name: `${assessmentResult.student.firstName} ${assessmentResult.student.lastName}`,
    };

    const notificationInstructorParam = {
      // @ts-ignore
      id: assessmentResult.subContent.course.instructor.id,
      // @ts-ignore
      name: `${assessmentResult.subContent.course.instructor.firstName} ${assessmentResult.subContent.course.instructor.lastName}`,
      // @ts-ignore
      role: assessmentResult.subContent.course.instructor.role,
      // @ts-ignore
      subContentTitle: assessmentResult.subContent.title,
      // @ts-ignore
      courseTitle: assessmentResult.subContent.course.title,
    };

    const message = this.prepareAssessmentAttemptNotificationMessage(
      notificationUserParam,
      notificationInstructorParam,
    );

    // Send bulk notification
    await this.notificationsService.createNotificationWithTransaction(
      message,
      queryRunner,
    );
  }

  /**
   * Create assessment attempt
   * @param createCourseContentSubDto
   * @returns
   */
  async createAttempt(
    studentIdDto: AuthPayload['user'],
    createAssessmentAttemptsDto: CreateAssessmentAttemptsDto,
  ): Promise<GenericPayload> {
    const { courseContentSub } = createAssessmentAttemptsDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Check course content sub
      await queryRunner.manager.findOne(CourseContentSubs, {
        where: { id: courseContentSub },
        relations: ['course', 'courseContent'],
      });

      // Collect and structure data
      const assessmentAttempt = this.asessmentAttempts.collect(
        createAssessmentAttemptsDto,
        studentIdDto['sub'] as IdDto['id'],
      );

      // Prepare data
      const preparedData =
        this.assessmentAttemptsRepository.create(assessmentAttempt);

      // Clear old attempts made
      await queryRunner.manager.delete(AssessmentAttempts, {
        assessmentQuestion: In(
          this.asessmentAttempts.getAssessmentQuestionIds(assessmentAttempt),
        ),
        student: In(this.asessmentAttempts.getStudentIds(assessmentAttempt)),
      });

      // Create or insert assessment attempts data
      await queryRunner.manager.insert(AssessmentAttempts, preparedData);

      // Fetch and compute assessment attempt
      const computedAttempt = await this.computeAssessmentResult(queryRunner);

      // Invoke assessment result service to save result
      const assessmentResult =
        await this.assessmentResultsService.createAssessmentResult(
          {
            ...computedAttempt,
            student: studentIdDto['sub'] as IdDto['id'],
            courseContentSub,
          },
          queryRunner,
        );

      // Prepare notification data, invoke the method to prepare and send assessment result bulk notification
      const notificationData = {
        student: {
          // @ts-ignore
          firstName: assessmentResult.student.firstName,
          // @ts-ignore
          lastName: assessmentResult.student.lastName,
        },
        subContent: {
          // @ts-ignore
          title: assessmentResult.courseContentSub.title,
          course: {
            // @ts-ignore
            title: assessmentResult.courseContentSub.course.title,
            instructor: {
              // @ts-ignore
              id: assessmentResult.courseContentSub.course.instructor.id,
              firstName:
                // @ts-ignore
                assessmentResult.courseContentSub.course.instructor.firstName,
              lastName:
                // @ts-ignore
                assessmentResult.courseContentSub.course.instructor.lastName,
              // @ts-ignore
              role: assessmentResult.courseContentSub.course.instructor.role,
            },
          },
        },
      };

      await this.sendAssessmentAttemptBulkNotification(
        notificationData,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Assessment attempt created successfully',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get assessment attempts by content sub
   * @param filter
   * @param courseContentSubIdDto
   * @returns
   */
  async fetchAttemptsByContentSub(
    data: AuthPayload['user'],
    filter: GenericFilter & IAssessmentAttempt,
    courseContentSubIdDto: IdDto,
  ): Promise<any> {
    const { ...params } = filter;
    const { id } = courseContentSubIdDto;

    // Check course content sub
    await this.courseContentSubsService.findOneContentSub(id);

    // Check if the student was the one who attempted the assessment questions
    const isStudent = await this.IsStudentAuthorized(
      data['sub'] as IdDto['id'],
      id,
    );
    if (!isStudent) {
      throw new ForbiddenException(
        "You are not authorized to see someone else's attempt",
      );
    }

    // Prepare criteria
    const where = {
      ...this.createAssessmentAttemptWhereQuery(params),
      assessmentQuestion: { courseContentSub: { id } },
    };

    // Query with paginateWithSelect() method
    const [results, total] = await this.paginateRelWithSelect(
      this.assessmentAttemptsRepository,
      filter,
      where,
      ['assessmentQuestion'],
      {
        assessmentQuestion: {
          question: true,
          options: true,
          correctOption: true,
          point: true,
        },
      },
    );

    // Fetch assessment result
    const assessmentResult =
      await this.assessmentResultsService.getAssessmentResult(
        courseContentSubIdDto,
      );

    return {
      data: {
        result: assessmentResult,
        attempt: results,
      },
      count: total,
    };
  }

  /**
   * Get a count of student's done assessments
   * @param courseId
   * @param studentId
   * @returns
   */
  async countStudentDoneAssessments(
    courseId: IdDto['id'],
    studentId: IdDto['id'],
  ): Promise<number> {
    const where = {
      courseContentSub: { course: { id: courseId } },
      student: { id: studentId },
    };
    const studentDoneAssessments = await this.assessmentResultsRepository.count(
      // @ts-ignore
      { where },
    );

    return studentDoneAssessments;
  }
}
