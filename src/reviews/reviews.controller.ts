import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import {
  AltPagePayload,
  GenericPayload,
  PagePayload,
} from 'src/generic/generic.payload';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { UserRole } from 'src/users/entities/user.entity';
import { CreateCourseReviewDto } from './dto/create-review.dto';
import { ICourseReview, Reviews } from './entities/reviews.entity';
import { IReviewWithAvg } from './review.payload';
import { ReviewsService } from './reviews.service';

@Controller('v1/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Create course review
   * @param req
   * @param createCourseReviewDto
   * @returns
   */
  @Post('/create-course-review')
  @Roles(UserRole.STUDENT)
  createCourseReview(
    @Request() req: AuthPayload,
    @Body() createCourseReviewDto: CreateCourseReviewDto,
  ): Promise<GenericPayload> {
    return this.reviewsService.addCourseReview(req.user, createCourseReviewDto);
  }

  /**
   * View course reviews for instructor
   * @param req
   * @param filter
   * @param courseIdDto
   * @returns
   */
  @Get('/view-course-reviews/:id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  viewCourseReviews(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & ICourseReview,
    @Param() courseIdDto: IdDto,
  ): Promise<AltPagePayload<IReviewWithAvg<Reviews>>> {
    return this.reviewsService.viewCourseReviews(
      req.user,
      filter,
      courseIdDto.id,
    );
  }

  /**
   * Fetch all course reviews - for student/visitor
   * @param req
   * @param filter
   * @param courseReviewIdDto
   * @returns
   */
  @Get('/fetch-course-reviews/:id')
  @Public()
  fetchCourseReviews(
    @Query() filter: GenericFilter & ICourseReview,
    @Param() courseReviewIdDto: IdDto,
  ): Promise<AltPagePayload<IReviewWithAvg<Reviews>>> {
    return this.reviewsService.fetchUnmutedCourseReviews(
      filter,
      courseReviewIdDto.id,
    );
  }

  /**
   * Mute course review - for instructor
   * @param courseReviewIdDto
   * @returns
   */
  @Post('/mute-course-review/:id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  muteCourseReview(@Param() courseReviewIdDto: IdDto): Promise<GenericPayload> {
    return this.reviewsService.muteCourseReview(courseReviewIdDto.id);
  }

  /**
   * Unmute course reviews - for instructor
   * @param courseReviewIdDto
   * @returns
   */
  @Post('/unmute-course-review/:id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  unmuteCourseReview(
    @Param() courseReviewIdDto: IdDto,
  ): Promise<GenericPayload> {
    return this.reviewsService.unmuteCourseReview(courseReviewIdDto.id);
  }
}
