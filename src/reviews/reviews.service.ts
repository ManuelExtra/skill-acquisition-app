import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { CoursesService } from 'src/courses/courses.service';
import { IdDto } from 'src/generic/dto/generic.dto';
import { AltPagePayload, GenericPayload } from 'src/generic/generic.payload';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { PageService } from 'src/generic/pagination/page.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { OrdersService } from 'src/orders/orders.service';
import { UserRole } from 'src/users/entities/user.entity';
import { DataSource, Like, QueryRunner, Repository } from 'typeorm';
import { CreateCourseReviewDto } from './dto/create-review.dto';
import { ICourseReview, ReviewFor, Reviews } from './entities/reviews.entity';
import { IReviewWithAvg } from './review.payload';

@Injectable()
export class ReviewsService extends PageService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Reviews)
    private readonly reviewsRepository: Repository<Reviews>,
    private readonly reviews: Reviews,

    private readonly coursesService: CoursesService,
    private readonly notificationsService: NotificationsService,

    private readonly ordersService: OrdersService,
  ) {
    super();
  }

  /**
   * A private method for creating a course review where query
   * @param params
   * @returns
   */
  private createCourseReviewWhereQuery(params: ICourseReview) {
    const where: any = {};

    if (params.user) {
      where.user = {
        firstName: Like(`%${params.user.firstName}%`),
        lastName: Like(`%${params.user.lastName}%`),
      };
    }

    if (params.rating) {
      where.rating = Boolean(+params.rating);
    }

    if (params.rating) {
      where.rating = Boolean(+params.rating);
    }

    if (params.item) {
      where.item = {
        title: Like(`%${params.item.title}%`),
      };
    }

    if (params.muted) {
      where.muted = Boolean(+params.muted);
    }

    return where;
  }

  /**
   * Prepare course review data for instructor
   * @param user
   * @param instructor
   * @returns
   */
  private prepareCourseReviewNotificationMessage(
    user: { name: string },
    instructor: {
      id: string;
      name: string;
      role: UserRole;
      courseTitle: string;
    },
  ) {
    // prepare notification body
    const instructorMessage = {
      title: `Course review`,
      body: `${user.name} has reviewed your course [${instructor.courseTitle}]`,
      userGroup: instructor.role,
      user: instructor.id as IdDto['id'],
    };

    // Bring them together
    const bulkMessage = [instructorMessage];

    return bulkMessage;
  }

  /**
   * Invoke prepareCourseReviewNotificationMessage() and send bulk notification
   * @param courseReview
   * @param queryRunner
   */
  private async sendCourseReviewBulkNotification(
    courseReview: {
      student: { firstName: string; lastName: string };
      course: {
        title: string;
        instructor: {
          id: string;
          role: UserRole;
          firstName: string;
          lastName: string;
        };
      };
    },
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Prepare notification messages (bulk)
    const notificationUserParam = {
      // @ts-ignore
      name: `${courseReview.student.firstName} ${courseReview.student.lastName}`,
    };

    const notificationInstructorParam = {
      // @ts-ignore
      id: courseReview.course.instructor.id,
      // @ts-ignore
      name: `${courseReview.course.instructor.firstName} ${courseReview.course.instructor.lastName}`,
      // @ts-ignore
      role: courseReview.course.instructor.role,
      // @ts-ignore
      courseTitle: courseReview.course.title,
    };

    const message = this.prepareCourseReviewNotificationMessage(
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
   * Add course review
   * @param userId
   * @param createCourseReviewDto
   * @returns
   */
  async addCourseReview(
    user: AuthPayload['user'],
    createCourseReviewDto: CreateCourseReviewDto,
  ): Promise<GenericPayload> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { item, rating, comment } = createCourseReviewDto;

      // Check item as a course
      await this.coursesService.findOnePublishedWithTransaction(
        item,
        queryRunner,
      );

      // Check if student is authorized to send review
      await this.ordersService.authorizeStudentCourse(user.sub, item);

      // Prepare review data
      const review = this.reviews.create(
        createCourseReviewDto,
        user.sub as IdDto['id'],
        ReviewFor.COURSE,
      );

      // Store data
      await queryRunner.manager.insert(Reviews, review);

      const courseReview = await queryRunner.manager.findOne(Reviews, {
        // @ts-ignore
        where: { user: { id: user.sub }, item: { id: item }, rating, comment },
        relations: ['user', 'item.instructor'],
      });

      // Prepare notification and invoke course review notification
      const notificationData = {
        student: {
          // @ts-ignore
          firstName: courseReview.user.firstName,
          // @ts-ignore
          lastName: courseReview.user.lastName,
        },
        course: {
          // @ts-ignore
          title: courseReview.item.title,
          instructor: {
            // @ts-ignore
            id: courseReview.item.instructor.id,
            // @ts-ignore
            role: courseReview.item.instructor.role,
            // @ts-ignore
            firstName: courseReview.item.instructor.firstName,
            // @ts-ignore
            lastName: courseReview.item.instructor.lastName,
          },
        },
      };

      await this.sendCourseReviewBulkNotification(
        notificationData,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Review created successfully',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all course reviews for instructor
   * @param filter
   * @param itemId
   * @returns
   */
  async viewCourseReviews(
    user: AuthPayload['user'],
    filter: GenericFilter & ICourseReview,
    itemId: string,
  ): Promise<AltPagePayload<IReviewWithAvg<Reviews>>> {
    const { ...params } = filter;

    const where = {
      ...this.createCourseReviewWhereQuery(params),
      item: { id: itemId, instructor: { id: user.sub } },
    };
    const relations = ['user'];
    const select = {
      user: {
        firstName: true,
        lastName: true,
        picture: true,
      },
    };
    const [results, total] = await this.paginateRelWithSelect(
      this.reviewsRepository,
      filter,
      where,
      relations,
      select,
    );

    const reviewTotal = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.item', 'course')
      .innerJoinAndSelect('review.user', 'student')
      .where('course.id = :id', { id: itemId })
      .where('course.instructor.id = :instructorId', { instructorId: user.sub })
      .select(['SUM(rating) as totalRating', 'AVG(rating) as avgRating'])
      .orderBy('course.createdDate', 'ASC')
      .getRawOne();

    const totalRating = ((total * 5) / total).toFixed(1);
    const avgRating = (+reviewTotal.avgRating).toFixed(1);

    return {
      data: {
        results,
        avgRating,
        totalRating,
      },
      count: total,
    };
  }

  /**
   * Get all unmuted course reviews for students/visitors
   * @param filter
   * @param itemId
   * @returns
   */
  async fetchUnmutedCourseReviews(
    filter: GenericFilter & ICourseReview,
    itemId: string,
  ): Promise<AltPagePayload<IReviewWithAvg<Reviews>>> {
    const { ...params } = filter;

    const where = {
      ...this.createCourseReviewWhereQuery(params),
      item: { id: itemId },
      muted: false,
    };
    const relations = ['user'];
    const select = {
      user: {
        firstName: true,
        lastName: true,
        picture: true,
      },
      id: true,
      rating: true,
      comment: true,
      createdDate: true,
    };
    const [results, total] = await this.paginateRelWithSelect(
      this.reviewsRepository,
      filter,
      where,
      relations,
      select,
    );

    const reviewTotal = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.item', 'course')
      .where('course.id = :id', { id: itemId })
      .select(['SUM(rating) as totalRating', 'AVG(rating) as avgRating'])
      .orderBy('course.createdDate', 'ASC')
      .getRawOne();

    const totalRating = ((total * 5) / total).toFixed(1);
    const avgRating = (+reviewTotal.avgRating).toFixed(1);

    return {
      data: {
        results,
        totalRating,
        avgRating,
      },
      count: total,
    };
  }

  /**
   * Mute course review
   * @param reviewId
   * @returns
   */
  async muteCourseReview(reviewId: string): Promise<GenericPayload> {
    // Check if course review exists
    const courseReview = await this.getCourseReview(reviewId);

    // Mute course review
    courseReview.muted = true;
    await this.reviewsRepository.save(courseReview);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course review muted successfully.',
    };
  }

  /**
   * Unmute course review
   * @param reviewId
   * @returns
   */
  async unmuteCourseReview(reviewId: string): Promise<GenericPayload> {
    // Check if course review exists
    const courseReview = await this.getCourseReview(reviewId);

    // Unmute course review
    courseReview.muted = false;
    await this.reviewsRepository.save(courseReview);

    return {
      statusCode: HttpStatus.OK,
      message: 'Course review unmuted successfully.',
    };
  }

  /**
   * Get course review
   * @param reviewId
   * @returns
   */
  async getCourseReview(reviewId: string): Promise<Reviews> {
    const courseReview = await this.reviewsRepository.findOne({
      where: { id: reviewId as IdDto['id'] },
    });

    if (!courseReview) {
      throw new NotFoundException('Course review not found.');
    }

    return courseReview;
  }
}
