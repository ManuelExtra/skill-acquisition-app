import {
  Controller,
  Get,
  Request,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { CreateOrderPayload } from './orders.payload';
import { CaptureOrderDto } from './dto/capture-order.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { IdDto } from 'src/generic/dto/generic.dto';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { IOrder, IOrderItem } from './entities/orders.entity';
import { CancelOrderDto } from './dto/cancel-order.dto';
import {
  CourseContentSubAssessmentQuestions,
  IAssessmentAttempt,
  IAssessmentResult,
  ICourseContentSubAssessmentQuestion,
} from 'src/courses/entities/course.entity';
import { CreateAssessmentAttemptsDto } from 'src/courses/dto/create-assessment-attempts.dto';
import { CreateCourseReadRecordDto } from 'src/reads/dto/create-course-read-record.dto';
import { OrderItems } from './entities/order-items.entity';

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create order
   * @param req
   * @param createOrderDto
   * @returns
   */
  @Post('create')
  @Roles(UserRole.STUDENT)
  create(
    @Request() req: AuthPayload,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderPayload> {
    return this.ordersService.create(req.user, createOrderDto);
  }

  /**
   * Confirm order
   * @param req
   * @param captureOrderDto
   * @returns
   */
  @Post('confirm/:thirdPartyRef')
  @Roles(UserRole.STUDENT)
  confirmOrder(
    @Request() req: AuthPayload,
    @Param() captureOrderDto: CaptureOrderDto,
  ): Promise<GenericPayload> {
    return this.ordersService.confirmOrder(req.user, captureOrderDto);
  }

  /**
   * Fetch student transactions
   * @param req
   * @param filter
   * @returns
   */
  @Get('fetch-student-trx')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUBADMIN)
  fetchStudentOrderTrx(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & IOrder,
  ) {
    return this.ordersService.viewOrderTrx(req.user, filter);
  }

  /**
   * Fetch ordered items for instructor or admin as an instructor
   * @param req
   * @param filter
   * @returns
   */
  @Get('fetch-ordered-items')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  fetchOrderedItemsForInstructor(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & IOrderItem,
  ) {
    return this.ordersService.viewOrderedItemsForInstructor(req.user, filter);
  }

  /**
   * Fetch ordered items for admin
   * @param req
   * @param filter
   * @returns
   */
  @Get('access-ordered-items')
  @Roles(UserRole.ADMIN)
  fetchOrderedItemsForAdmin(@Query() filter: GenericFilter & IOrderItem) {
    return this.ordersService.viewOrderedItemsForAdmin(filter);
  }

  /**
   * Fetch student ordered item for instructor or admin as an instructor
   * @param req
   * @param filter
   * @returns
   */
  @Get('ordered-item-details/:id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  fetchOrderedItemDetailsForInstructor(
    @Request() req: AuthPayload,
    @Param() orderItemDto: IdDto,
  ) {
    return this.ordersService.viewOrderedItemForInstructor(
      req.user,
      orderItemDto,
    );
  }

  /**
   * Fetch student transactions for admin
   * @param req
   * @param filter
   * @returns
   */
  @Get('access-item-details/:id')
  @Roles(UserRole.ADMIN)
  fetchOrderedItemDetailsForAdmin(@Param() orderItemDto: IdDto) {
    return this.ordersService.viewOrderedItemForAdmin(orderItemDto);
  }

  /**
   * Fetch transaction details
   * @param req
   * @param filter
   * @returns
   */
  @Get('fetch-trx/:id')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUBADMIN)
  fetchOrderTrxDetails(@Request() req: AuthPayload, @Param() idDto: IdDto) {
    return this.ordersService.viewOrderTrxDetails(req.user, idDto);
  }

  /**
   * Cancel order - before payment
   * @param req
   * @param cancelOrderDto
   * @returns
   */
  @Post('cancel-order/:orderNumber')
  @Roles(UserRole.STUDENT)
  cancelOrder(
    @Request() req: AuthPayload,
    @Param() cancelOrderDto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrderForStudent(req.user, cancelOrderDto);
  }

  /**
   * Cancel order - before payment
   * @param req
   * @param cancelOrderDto
   * @returns
   */
  @Post('cancel-student-order/:orderNumber')
  @Roles(UserRole.ADMIN, UserRole.SUBADMIN)
  cancelStudentOrder(@Param() cancelOrderDto: CancelOrderDto) {
    return this.ordersService.cancelOrderForAdmin(cancelOrderDto);
  }

  /**
   * Get a course with contents and subs endpoint (include media)
   * @param req
   * @param courseIdDto
   * @returns
   */
  @Get('fetch-course/:id')
  @Roles(UserRole.STUDENT)
  findOneForVerifiedUsers(
    @Request() req: AuthPayload,
    @Param() courseIdDto: IdDto,
  ) {
    return this.ordersService.fetchOrderedCourseDetails(req.user, courseIdDto);
  }

  /**
   * Get assessment question endpoint
   * @param req
   * @param filter
   * @param courseContentSubIdDto
   * @returns
   */
  @Get('assessment-questions/:id')
  @Roles(UserRole.STUDENT)
  fetchQuestionsForStudents(
    @Request() req: AuthPayload & Request,
    @Query() filter: GenericFilter & ICourseContentSubAssessmentQuestion,
    @Param() courseContentSubIdDto: IdDto,
  ): Promise<PagePayload<CourseContentSubAssessmentQuestions>> {
    return this.ordersService.fetchQuestionsForStudents(
      // @ts-ignore
      req.user,
      req.headers['course-request-id'],
      filter,
      courseContentSubIdDto,
    );
  }

  /**
   * Create assessment attempt for the content sub questions
   * @param req
   * @param createAssessmentAttemptDto
   * @returns
   */
  @Post('attempt')
  @Roles(UserRole.STUDENT)
  createAttempt(
    @Request() req: AuthPayload & Request,
    @Body() createAssessmentAttemptDto: CreateAssessmentAttemptsDto,
  ): Promise<GenericPayload> {
    return this.ordersService.createAttempt(
      // @ts-ignore
      req.user,
      req.headers['course-request-id'],
      createAssessmentAttemptDto,
    );
  }

  /**
   * Fetch assessment attempts by content sub
   * @param req
   * @param filter
   * @param courseContentSubDto
   * @returns
   */
  @Get('fetch-attempts/:id')
  @Roles(UserRole.STUDENT)
  fetchAttemptsByContentSub(
    @Request() req: AuthPayload & Request,
    @Query() filter: GenericFilter & IAssessmentAttempt,
    @Param() courseContentSubDto: IdDto,
  ) {
    console.log(filter);

    return this.ordersService.fetchAttemptsByContentSub(
      req.user,
      req.headers['course-request-id'],
      filter,
      courseContentSubDto,
    );
  }

  /**
   * Fetch course assessments result
   * @param req
   * @param filter
   * @param courseContentSubDto
   * @returns
   */
  @Get('fetch-assessments-result')
  @Roles(UserRole.STUDENT)
  fetchCourseAssessmentsResult(
    @Request() req: AuthPayload & Request,
    @Query() filter: GenericFilter & IAssessmentResult,
  ) {
    return this.ordersService.fetchCourseAssessmentResults(
      filter,
      req.user,
      req.headers['course-request-id'],
    );
  }

  /**
   * Record a course read record
   * @param userDto
   * @param createCourseReadRecordDto
   * @returns
   */
  @Post('record-course-read')
  @Roles(UserRole.STUDENT)
  createCourseRead(
    @Request() req: Request & AuthPayload,
    @Body() createCourseReadRecordDto: CreateCourseReadRecordDto,
  ): Promise<GenericPayload> {
    return this.ordersService.createCourseReadRecord(
      req.user,
      req.headers['course-request-id'],
      createCourseReadRecordDto,
    );
  }

  /**
   * Fetch purchased courses
   * @param req
   * @param filter
   * @returns
   */
  @Get('purchased-courses')
  @Roles(UserRole.STUDENT)
  purchasedCourses(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & IOrderItem,
  ): Promise<PagePayload<OrderItems>> {
    return this.ordersService.fetchPurchasedCourses(req.user, filter);
  }
}
