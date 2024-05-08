import {
  BadRequestException,
  NotFoundException,
  Injectable,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, Like, QueryRunner, Repository } from 'typeorm';

import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto, IdDtoAlias } from 'src/generic/dto/generic.dto';
import { MailService } from 'src/mail/mail.service';
import {
  ICourseTrx,
  PaymentGateway,
} from 'src/transactions/entities/transactions.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UserRole, Users } from 'src/users/entities/user.entity';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ICreateOrderItem, OrderItems } from './entities/order-items.entity';
import {
  ICreateOrder,
  IOrder,
  IOrderItem,
  Orders,
  OrderStatus,
} from './entities/orders.entity';
import {
  computeAmountWithTaxRate,
  courseProgress,
  isPriceSumSameWithOrderPriceSum,
  isPriceSumSameWithTotalSupplied,
  TAXRATE,
} from './orders.utils';
import { PaypalService } from './provider/paypal.provider';
import { CreateOrderPayload } from './orders.payload';
import { CaptureOrderDto } from './dto/capture-order.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { InjectRepository } from '@nestjs/typeorm';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { PageService } from 'src/generic/pagination/page.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import {
  AssessmentAttemptsService,
  AssessmentResultsService,
  CourseContentSubAssessmentQuestionsService,
  CourseContentSubsService,
} from 'src/courses/courses.service';
import {
  AssessmentResults,
  CourseContentSubAssessmentQuestions,
  CourseContentSubMediaTypes,
  IAssessmentAttempt,
  ICourseContentSubAssessmentQuestion,
} from 'src/courses/entities/course.entity';
import { CreateAssessmentAttemptsDto } from 'src/courses/dto/create-assessment-attempts.dto';
import { ReadsService } from 'src/reads/reads.service';
import { CreateCourseReadRecordDto } from 'src/reads/dto/create-course-read-record.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class OrdersService extends PageService {
  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(OrderItems)
    private readonly orderItemsRepository: Repository<OrderItems>,

    private readonly orders: Orders,
    private readonly orderItems: OrderItems,

    private readonly dataSource: DataSource,
    private readonly transactionsService: TransactionsService,

    private readonly mailService: MailService,
    private readonly paypalService: PaypalService,
    private readonly courseContentSubsService: CourseContentSubsService,
    private readonly assessmentQuestionsService: CourseContentSubAssessmentQuestionsService,
    private readonly assessmentAttemptsService: AssessmentAttemptsService,
    private readonly readsService: ReadsService,
    private readonly assessmentResultsService: AssessmentResultsService,

    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  /**
   * A private method for creating an order where query
   * @param params
   * @returns
   */
  private createOrderWhereQuery(params: IOrder) {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.trx) {
      where.trx = {
        reference: params.trx.reference,
        thirdPartyRef: params.trx.thirdPartyRef,
      };
    }

    if (params.buyer) {
      where.buyer = {
        firstName: params.buyer.firstName,
        lastName: params.buyer.lastName,
        email: params.buyer.email,
      };
    }

    return where;
  }

  /**
   * A private method for creating an order item where query
   * @param params
   * @returns
   */
  private createOrderItemWhereQuery(params: IOrderItem): IOrderItem {
    const where: any = {};

    if (params.course) {
      where.course = {
        title: Like(`%${params.course.title}%`),
      };
    }

    if (params.order) {
      where.order = {
        status: params.order.status,
      };
    }

    return where;
  }

  /**
   * Submit order
   * @param createOrder
   * @param queryRunner
   * @returns
   */
  private async submitOrder(
    createOrder: ICreateOrder,
    queryRunner: QueryRunner,
  ): Promise<Orders> {
    // Prepare data
    const order = this.orders.create(createOrder);

    // Store data
    await queryRunner.manager.insert(Orders, order);

    return order;
  }

  /**
   * Function to check if student has ordered for a course
   * @param courseId
   * @returns
   */
  private async HasStudentOrderedForCourse(
    courseId: string,
    studentId: string,
  ): Promise<boolean> {
    // Check existence
    const isOrdered = await this.orderItemsRepository.exists({
      where: {
        // @ts-ignore
        course: { id: courseId },
        // @ts-ignore
        order: { buyer: { id: studentId }, status: OrderStatus.CONFIRMED },
      },
    });

    return isOrdered;
  }

  /**
   * Prepare course enrollment bulk notification message for instructor, admin as an instructor, admin and subadmin
   * @param user
   * @param instructors
   * @returns
   */
  private prepareCourseEnrollmentNotificationMessage(
    user: { name: string },
    instructors: {
      id: string;
      name: string;
      role: UserRole;
      courseTitle: string;
    }[],
  ) {
    // prepare notification body
    const instructorsMessage = instructors.map((instructor) => {
      return {
        title: `Course enrollment`,
        body: `${user.name} has enrolled for your course [${instructor.courseTitle}]`,
        userGroup: instructor.role,
        user: instructor.id,
      };
    });

    const adminMessage = instructors
      .map((instructor) => {
        if (instructor.role === UserRole.INSTRUCTOR) {
          return {
            title: `Course enrollment`,
            body: `${user.name} has enrolled for the course [${instructor.courseTitle}] created by ${instructor.name} [${instructor.role}]`,
            userGroup: UserRole.ADMIN,
          };
        }
      })
      .filter((instructor) => instructor !== undefined);

    const subadminMessage = instructors.map((instructor) => {
      return {
        title: `Course enrollment`,
        body: `${user.name} has enrolled for the course [${instructor.courseTitle}] created by ${instructor.name} [${instructor.role}]`,
        userGroup: UserRole.SUBADMIN,
      };
    });

    // Bring them together
    const bulkMessage = [
      ...instructorsMessage,
      ...adminMessage,
      ...subadminMessage,
    ];

    return bulkMessage;
  }

  /**
   * Confirm order with trx id
   * @param createOrder
   * @param queryRunner
   * @returns
   */
  private async confirmOrderWithTrxId(
    trxId: string,
    queryRunner: QueryRunner,
  ): Promise<Orders> {
    // Fetch order by trx id
    const order = await queryRunner.manager.findOne(Orders, {
      // @ts-ignore
      where: { trx: { id: trxId } },
      relations: ['orderItems.course.instructor', 'buyer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Confirm order
    await queryRunner.manager.update(
      Orders,
      {
        trx: { id: trxId },
      },
      { status: OrderStatus.CONFIRMED },
    );

    // Prepare notification messages (bulk)
    const notificationUserParam = {
      // @ts-ignore
      name: `${order.buyer.firstName} ${order.buyer.lastName}`,
    };
    // @ts-ignore
    const notificationInstructorParam = order.orderItems.map((orderItem) => {
      return {
        // @ts-ignore
        id: orderItem.course.instructor.id,
        // @ts-ignore
        name: `${orderItem.course.instructor.firstName} ${orderItem.course.instructor.lastName}`,
        // @ts-ignore
        role: orderItem.course.instructor.role,
        // @ts-ignore
        courseTitle: orderItem.course.title,
      };
    });
    const message = this.prepareCourseEnrollmentNotificationMessage(
      notificationUserParam,
      notificationInstructorParam,
    );

    // Send bulk notification
    await this.notificationsService.createNotificationWithTransaction(
      message,
      queryRunner,
    );

    return order;
  }

  /**
   * Submit order
   * @param createOrder
   * @param queryRunner
   * @returns
   */
  private async submitOrderItems(
    createOrderItemDto: CreateOrderItemDto,
    queryRunner: QueryRunner,
  ): Promise<ICreateOrderItem[]> {
    // Collect and structure data
    const orderItems = this.orderItems.collect(createOrderItemDto);

    // Prepare data
    const preparedData = queryRunner.manager.create(OrderItems, orderItems);

    // Store data
    await queryRunner.manager.insert(OrderItems, preparedData);

    return orderItems;
  }

  /**
   * cancel pending order with buyer id and order number
   * @param buyerId
   * @param orderNumber
   */
  private async cancelPendingOrder(
    { buyerId, trxId }: { buyerId: string; trxId: string },
    queryRunner: QueryRunner,
  ): Promise<Orders> {
    // Update single order's status to OrderStatus.CANCELLED with criteria
    const order = await queryRunner.manager.update(
      Orders,
      {
        buyer: { id: buyerId },
        trx: { id: trxId },
        status: OrderStatus.PENDING,
      },
      { status: OrderStatus.CANCELLED },
    );

    if (!order.affected) {
      throw new NotFoundException('Order not available for cancellation.');
    }

    // Retrieve order full details
    const orderFullDetails = await queryRunner.manager.findOne(Orders, {
      where: {
        // @ts-ignore
        buyer: { id: buyerId },
        // @ts-ignore
        trx: { id: trxId },
      },
      relations: ['orderItems.course', 'buyer'],
    });

    return orderFullDetails;
  }

  /**
   * cancel pending order with order number - for admin
   * @param orderNumber
   */
  private async cancelPendingOrderForAdmin(
    { trxId }: { trxId: string },
    queryRunner: QueryRunner,
  ): Promise<Orders> {
    // Update single order's status to OrderStatus.CANCELLED with criteria
    const order = await queryRunner.manager.update(
      Orders,
      {
        trx: { id: trxId },
        status: OrderStatus.PENDING,
      },
      { status: OrderStatus.CANCELLED },
    );

    if (!order.affected) {
      throw new NotFoundException('Order not available for cancellation.');
    }

    // Retrieve order full details
    const orderFullDetails = await queryRunner.manager.findOne(Orders, {
      where: {
        // @ts-ignore
        trx: { id: trxId },
      },
      relations: ['orderItems.course', 'buyer'],
    });

    return orderFullDetails;
  }

  /**
   * Check if course has been ordered for
   * @param userId
   * @param courses
   * @param queryRunner
   */
  private async courseOrderedFor(
    userId: string,
    courses: CreateOrderDto['courses'],
    queryRunner: QueryRunner,
  ): Promise<void> {
    for (let index = 0; index < courses.length; index++) {
      const course = courses[index];

      const purchased = await queryRunner.manager.findOne(OrderItems, {
        where: {
          // @ts-ignore
          order: { buyer: { id: userId }, status: OrderStatus.CONFIRMED },
          // @ts-ignore
          course: { id: course.id },
        },
        relations: ['course'],
      });

      if (purchased) {
        throw new BadRequestException(
          // @ts-ignore
          `This course [${purchased.course.title}] has already been purchased`,
        );
      }
    }
  }

  /**
   * Create order (paypal api integration)
   * @param user
   * @param createOrderDto
   * @returns
   */
  async create(
    user: AuthPayload['user'],
    createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderPayload> {
    let { courses, amount } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Check if course has been ordered for
      await this.courseOrderedFor(user.sub, courses, queryRunner);

      // Compute with tax rate
      const amountWithTax = computeAmountWithTaxRate(amount);

      // Create order with paypal
      const paypalOrder = await this.paypalService.createOrder(amountWithTax);

      // Prepare orderTrx data
      const orderTrx: ICourseTrx = {
        user: user.sub as IdDto['id'],
        amount: amountWithTax,
        subAmount: amount,
        courseNo: courses.length,
        thirdPartyRef: paypalOrder.id,
      };
      // Store transaction
      const trx = await this.transactionsService.createOrderTrx(
        orderTrx,
        queryRunner,
      );

      // Prepare order data
      const orderBody: ICreateOrder = {
        buyer: user.sub as IdDto['id'],
        trx: trx.id as IdDto['id'],
      };
      // Store order
      const order = await this.submitOrder(orderBody, queryRunner);

      // Prepare order items data
      const orderItemsBody: CreateOrderItemDto = {
        courses,
        order: order.id as IdDto['id'],
      };
      // Store order items
      await this.submitOrderItems(orderItemsBody, queryRunner);

      // Fetch order items
      const savedOrderItems = await this.fetchItems(
        order.id as IdDto['id'],
        queryRunner,
      );

      // Check price sum with order item prices
      if (!isPriceSumSameWithOrderPriceSum(savedOrderItems.priceSum, courses)) {
        throw new BadRequestException(
          "The Sum of the course(s') price(s) does not amount to the order item(s') price(s) supplied",
        );
      }

      // Check price sum with total
      if (
        !isPriceSumSameWithTotalSupplied(
          savedOrderItems.priceSum,
          amountWithTax,
        )
      ) {
        throw new BadRequestException(
          "The Sum of the course(s') prices does not amount to the total supplied",
        );
      }

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Order created successfully',
        data: {
          orderNumber: paypalOrder.id,
          status: paypalOrder.status,
          link: paypalOrder.links[1].href,
        },
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Fetch order items by order id
   * @param orderIdDto
   * @param queryRunner
   * @returns
   */
  async fetchItems(
    id: IdDto['id'],
    queryRunner: QueryRunner,
  ): Promise<{ orderItems: OrderItems[]; priceSum: number }> {
    // Fetch order items
    const orderItems = await queryRunner.manager.find(OrderItems, {
      // @ts-ignore
      where: { order: { id } },
      relations: ['course'],
      select: {
        // @ts-ignore
        course: {
          title: true,
          price: true,
        },
        price: true,
      },
    });

    // Fetch aggregate value
    const aggregateOrderItem = await queryRunner.manager.query(
      `SELECT SUM(courses.price - (courses.price * courses.discount/100)) as price FROM order_items INNER JOIN courses WHERE courses.id = order_items.courseId AND order_items.orderId = '${id}';`,
    );

    return {
      orderItems,
      priceSum: aggregateOrderItem[0].price,
    };
  }

  /**
   * Confirm order (paypal api integration)
   * @param user
   * @param orderNumberDto
   * @returns
   */
  async confirmOrder(
    user: AuthPayload['user'],
    orderNumberDto: CaptureOrderDto,
  ): Promise<GenericPayload> {
    const { thirdPartyRef } = orderNumberDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Retrieve buyer's details
      const buyerDetails = await queryRunner.manager.findOne(Users, {
        where: { id: user.sub },
      });

      // Create order with paypal
      await this.paypalService.captureOrder(thirdPartyRef);

      // Confirm transaction
      const trx = await this.transactionsService.confirmTrxStatusBy3rdPartyRef(
        thirdPartyRef,
        queryRunner,
      );

      // Confirm order
      const order = await this.confirmOrderWithTrxId(trx.id, queryRunner);

      // Send email notification to buyer
      await this.mailService.sendCourseOrderEmail(
        {
          email: buyerDetails.email,
          firstName: buyerDetails.firstName,
          lastName: buyerDetails.lastName,
        },
        {
          trxDate: trx.createdDate.toLocaleDateString(),
          trxNo: trx.reference,
          subAmount: `$${trx.subAmount.toFixed(2)}`,
          amount: `$${trx.amount.toFixed(2)}`,
          taxRate: `${TAXRATE}%`,
          total: `$${trx.amount.toLocaleString()}`,
          gateway: trx.gateway,
          items: order.orderItems,
        },
      );

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: 'Order confirmed successfully',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * View student's orders with transaction & admin
   * @param userDto
   * @param filter
   * @returns
   */
  async viewOrderTrx(
    userDto: AuthPayload['user'],
    filter: GenericFilter & IOrder,
  ): Promise<PagePayload<Orders>> {
    const { sub, role } = userDto;
    const { ...params } = filter;

    const where = {
      ...this.createOrderWhereQuery(params),
    };

    if (role === UserRole.STUDENT) {
      where.buyer = { id: sub };
    }

    const select = ['trx', 'orderItems.course'];

    if (role !== UserRole.STUDENT) {
      select.push('buyer');
    }

    // Get student's orders in relation with transaction
    const [results, total] = await this.paginateRel<Orders>(
      this.ordersRepository,
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
   * Get single transaction details with trx and buyer id
   * @param userDto
   * @param trxDto
   * @returns
   */
  async viewOrderTrxDetails(
    userDto: AuthPayload['user'],
    trxDto: IdDto,
  ): Promise<Orders> {
    const where = {
      // @ts-ignore
      trx: { id: trxDto.id },
    };
    const relations = ['orderItems.course.instructor', 'trx'];

    if (userDto.role === UserRole.STUDENT) {
      // @ts-ignore
      where.buyer = { id: userDto.sub };
    } else {
      relations.push('buyer');
    }

    // Get single order trx details
    const order = await this.ordersRepository.findOne({
      // @ts-ignore
      where,
      relations,
    });

    return Object(order);
  }

  /**
   * View ordered items for instructors
   * @param userDto
   * @param filter
   * @returns
   */
  async viewOrderedItemsForInstructor(
    userDto: AuthPayload['user'],
    filter: GenericFilter & IOrderItem,
  ): Promise<PagePayload<OrderItems>> {
    const { sub } = userDto;
    const { ...params } = filter;

    const orderItemFilter = this.createOrderItemWhereQuery(params);
    const where = {
      ...orderItemFilter,
      course: { ...orderItemFilter.course, instructor: { id: sub } },
    };

    // Get ordered items that concerns the instructor in relation with order
    const [results, total] = await this.paginateRel<OrderItems>(
      this.orderItemsRepository,
      filter,
      where,
      ['course', 'order.buyer'],
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * View ordered items for admin
   * @param filter
   * @returns
   */
  async viewOrderedItemsForAdmin(
    filter: GenericFilter & IOrderItem,
  ): Promise<PagePayload<OrderItems>> {
    const { ...params } = filter;

    const orderItemFilter = this.createOrderItemWhereQuery(params);
    const where = {
      ...orderItemFilter,
      course: { ...orderItemFilter.course },
    };

    // Get ordered items in relation with order
    const [results, total] = await this.paginateRel<OrderItems>(
      this.orderItemsRepository,
      filter,
      where,
      ['course.instructor', 'order.buyer'],
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * View single ordered item for instructors
   * @param userDto
   * @param orderItemDto
   * @returns
   */
  async viewOrderedItemForInstructor(
    userDto: AuthPayload['user'],
    orderItemDto: IdDto,
  ): Promise<any> {
    const { sub } = userDto;

    // Get ordered items that concerns the instructor in relation with order
    const orderItem = await this.orderItemsRepository.findOne({
      where: {
        id: orderItemDto.id,
        // @ts-ignore
        course: { instructor: { id: sub } },
      },
      relations: ['course', 'order.buyer', 'order.trx'],
    });

    // Fetch course reads
    const reads = await this.readsService.courseReadsNumber(
      // @ts-ignore
      orderItem.course.id,
      // @ts-ignore
      orderItem.order.buyer.id,
    );

    // Fetch content sub total
    const contentSubs = await this.courseContentSubsService.contentSubsNumber(
      // @ts-ignore
      orderItem.course.id,
    );

    // Get assessment results
    const assessmentResults =
      await this.assessmentResultsService.getAssessmentResults(
        // @ts-ignore
        { id: orderItem.course.id } as IdDtoAlias,
        // @ts-ignore
        orderItem.order.buyer.id,
      );

    return {
      ...orderItem,
      reads: {
        done: reads,
        outOf: contentSubs,
      },
      assessmentResults,
    };
  }

  /**
   * View single ordered item for admin
   * @param orderItemDto
   * @returns
   */
  async viewOrderedItemForAdmin(orderItemDto: IdDto): Promise<any> {
    // Get ordered items that concerns the instructor in relation with order
    const orderItem = await this.orderItemsRepository.findOne({
      where: {
        id: orderItemDto.id,
      },
      relations: ['course.instructor', 'order.buyer', 'order.trx'],
    });

    // Fetch course reads
    const reads = await this.readsService.courseReadsNumber(
      // @ts-ignore
      orderItem.course.id,
    );

    // Fetch content sub total
    const contentSubs = await this.courseContentSubsService.contentSubsNumber(
      // @ts-ignore
      orderItem.course.id,
    );

    // Get assessment results
    const assessmentResults =
      await this.assessmentResultsService.getAssessmentResults(
        // @ts-ignore
        { id: orderItem.course.id } as IdDtoAlias,
      );

    return {
      ...orderItem,
      reads: {
        done: reads,
        outOf: contentSubs,
      },
      assessmentResults,
    };
  }

  /**
   * Cancel order for student
   * @param userDto
   * @param cancelOrderDto
   * @returns
   */
  async cancelOrderForStudent(
    userDto: AuthPayload['user'],
    cancelOrderDto: CancelOrderDto,
  ): Promise<GenericPayload> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { sub } = userDto;
      const { orderNumber } = cancelOrderDto;

      // Cancel trx
      const trx = await this.transactionsService.cancelPendingTrx(
        { buyerId: sub, orderNumber },
        queryRunner,
      );

      // Cancel order (is a pending order and it exists)
      const order = await this.cancelPendingOrder(
        { buyerId: sub, trxId: trx.id },
        queryRunner,
      );

      // Send email
      await this.mailService.sendOrderCancellationEmail(
        {
          // @ts-ignore
          firstName: order.buyer.firstName,
          // @ts-ignore
          lastName: order.buyer.lastName,
          // @ts-ignore
          email: order.buyer.email,
        },
        {
          trxDate: trx.createdDate.toLocaleDateString(),
          trxNo: trx.reference,
          subAmount: `$${trx.subAmount.toFixed(2)}`,
          amount: `$${trx.amount.toFixed(2)}`,
          taxRate: `${TAXRATE}%`,
          total: `$${trx.amount.toLocaleString()}`,
          gateway: trx.gateway,
          items: order.orderItems,
        },
      );

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: 'Order cancelled successfully',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel order - logic for admin
   * @param cancelOrderDto
   * @returns
   */
  async cancelOrderForAdmin(
    cancelOrderDto: CancelOrderDto,
  ): Promise<GenericPayload> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { orderNumber } = cancelOrderDto;

      // Cancel trx
      const trx = await this.transactionsService.cancelPendingTrxForAdmin(
        { orderNumber },
        queryRunner,
      );

      // Cancel order (is a pending order and it exists)
      const order = await this.cancelPendingOrderForAdmin(
        { trxId: trx.id },
        queryRunner,
      );

      // Send email
      await this.mailService.sendOrderCancellationEmail(
        {
          // @ts-ignore
          firstName: order.buyer.firstName,
          // @ts-ignore
          lastName: order.buyer.lastName,
          // @ts-ignore
          email: order.buyer.email,
        },
        {
          trxDate: trx.createdDate.toLocaleDateString(),
          trxNo: trx.reference,
          subAmount: `$${trx.subAmount.toFixed(2)}`,
          amount: `$${trx.amount.toFixed(2)}`,
          taxRate: `${TAXRATE}%`,
          total: `$${trx.amount.toLocaleString()}`,
          gateway: trx.gateway,
          items: order.orderItems,
        },
      );

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.OK,
        message: 'Order cancelled successfully',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Authorize student course
   * @param studentId
   * @param courseId
   * @param courseContentSubId
   */
  async authorizeStudentCourse(
    studentId: string,
    courseId: string,
    courseContentSubId?: string | undefined,
  ): Promise<void> {
    if (!courseId) {
      throw new UnauthorizedException(
        '`Course-Request-Id` header must be provided',
      );
    }

    const isCourseOrdered = await this.HasStudentOrderedForCourse(
      courseId,
      studentId,
    );

    if (!isCourseOrdered) {
      throw new BadRequestException('Unathorized access to this course');
    }

    if (courseContentSubId) {
      const isContentSubFound =
        await this.courseContentSubsService.IsContentSubValid(
          courseId,
          courseContentSubId,
        );

      if (!isContentSubFound) {
        throw new BadRequestException('Course content sub not found.');
      }
    }
  }

  /**
   * Fetch ordered course details
   * @param user
   * @param courseIdDto
   * @returns
   */
  async fetchOrderedCourseDetails(
    user: AuthPayload['user'],
    courseIdDto: IdDto,
  ) {
    const { id } = courseIdDto;

    // Check to see if student has enrolled for the course
    await this.authorizeStudentCourse(user.sub, id);

    // Fetch ordered course details
    const orderedCourse =
      await this.courseContentSubsService.findOneCourseWithContentsAndSubsVerified(
        user,
        courseIdDto,
      );

    // Fetch course reads
    const reads = await this.readsService.fetchCourseReads(id, user.sub);

    // Get assessment results
    const assessmentResults =
      await this.assessmentResultsService.getAssessmentResults(
        courseIdDto,
        user.sub,
      );

    return {
      ...orderedCourse,
      reads,
      assessmentResults,
    };
  }

  /**
   * Fetch questions for students
   * @param user
   * @param courseRequestId
   * @param filter
   * @param courseContentSubIdDto
   * @returns
   */
  async fetchQuestionsForStudents(
    user: AuthPayload['user'],
    courseRequestId: string,
    filter: GenericFilter & ICourseContentSubAssessmentQuestion,
    courseContentSubIdDto: IdDto,
  ): Promise<PagePayload<CourseContentSubAssessmentQuestions>> {
    // Check to see if student has enrolled for the course
    await this.authorizeStudentCourse(
      user.sub,
      courseRequestId,
      courseContentSubIdDto.id,
    );

    const questions =
      await this.assessmentQuestionsService.findAllContentSubAssessmentQuestions(
        filter,
        courseContentSubIdDto,
      );

    return questions;
  }

  /**
   * Fetch questions for students
   * @param user
   * @param courseRequestId
   * @param createAssessmentAttemptDto
   * @returns
   */
  async createAttempt(
    user: AuthPayload['user'],
    courseRequestId: string,
    createAssessmentAttemptDto: CreateAssessmentAttemptsDto,
  ): Promise<GenericPayload> {
    // Check to see if student has enrolled for the course
    await this.authorizeStudentCourse(
      user.sub,
      courseRequestId,
      createAssessmentAttemptDto.courseContentSub,
    );

    const questions = await this.assessmentAttemptsService.createAttempt(
      user,
      createAssessmentAttemptDto,
    );

    return questions;
  }

  /**
   * Fetch attempts by contentSub
   * @param user
   * @param courseRequestId
   * @param createAssessmentAttemptDto
   * @returns
   */
  async fetchAttemptsByContentSub(
    user: AuthPayload['user'],
    courseRequestId: string,
    filter: GenericFilter & IAssessmentAttempt,
    courseContentSubDto: IdDto,
  ): Promise<GenericPayload> {
    // Check to see if student has enrolled for the course
    await this.authorizeStudentCourse(
      user.sub,
      courseRequestId,
      courseContentSubDto.id,
    );

    const attemptsData =
      await this.assessmentAttemptsService.fetchAttemptsByContentSub(
        user,
        filter,
        courseContentSubDto,
      );

    return attemptsData;
  }

  /**
   * Fetch course assessment result
   * @param user
   * @param courseRequestId
   * @param createAssessmentAttemptDto
   * @returns
   */
  async fetchCourseAssessmentResults(
    filter: GenericFilter,
    user: AuthPayload['user'],
    courseRequestId: string,
  ): Promise<PagePayload<AssessmentResults>> {
    // Check to see if student has enrolled for the course
    await this.authorizeStudentCourse(user.sub, courseRequestId);

    const resultData =
      await this.assessmentResultsService.getPaginatedAssessmentResults(
        filter,
        courseRequestId,
        user.sub,
      );

    return resultData;
  }

  /**
   * Fetch attempts by contentSub
   * @param user
   * @param courseRequestId
   * @param createAssessmentAttemptDto
   * @returns
   */
  async createCourseReadRecord(
    user: AuthPayload['user'],
    courseRequestId: string,
    createCourseReadRecordDto: CreateCourseReadRecordDto,
  ): Promise<GenericPayload> {
    // Check to see if student has enrolled for the course
    await this.authorizeStudentCourse(
      user.sub,
      courseRequestId,
      createCourseReadRecordDto.courseContentSub,
    );

    const attemptsData = await this.readsService.createCourseReadRecord(
      courseRequestId,
      user,
      createCourseReadRecordDto,
    );

    return attemptsData;
  }

  /**
   * Fetch purchased courses
   * @param filter
   * @param user
   * @returns
   */
  async fetchPurchasedCourses(
    user: AuthPayload['user'],
    filter: GenericFilter & IOrderItem,
  ): Promise<PagePayload<OrderItems>> {
    const { ...params } = filter;

    if (filter.pageSize) {
      delete filter.pageSize;
    }

    const where = {
      ...this.createOrderItemWhereQuery(params),
      // @ts-ignore
      order: {
        ...this.createOrderItemWhereQuery(params).order,
        buyer: { id: user.sub },
      },
    };

    const relations = ['course', 'order'];

    const [result, total] = await this.paginateRel(
      this.orderItemsRepository,
      filter,
      where,
      relations,
    );

    // Loop through order items / courses
    for (let index = 0; index < result.length; index++) {
      const orderItem = result[index];

      // Fetch course' content sub total number (excluding assessment)
      const totalCourseNo =
        await this.courseContentSubsService.fetchContentSubsCount(
          // @ts-ignore
          orderItem.course.id,
          CourseContentSubMediaTypes.ASSESSMENT,
          true,
        );

      // Fetch student's course content reads
      const contentReadsNo = await this.readsService.courseReadsNumber(
        // @ts-ignore
        orderItem.course.id,
        user.sub,
      );

      // Fetch course' content sub total number (assessment only)
      const totalCourseAssessmentNo =
        await this.courseContentSubsService.fetchContentSubsCount(
          // @ts-ignore
          orderItem.course.id,
          CourseContentSubMediaTypes.ASSESSMENT,
          false,
        );

      // Fetch student's done assessment number
      const doneAssessments =
        await this.assessmentAttemptsService.countStudentDoneAssessments(
          // @ts-ignore
          orderItem.course.id,
          user.sub as IdDto['id'],
        );

      // @ts-ignore
      result[index].course.totalContent = courseProgress(
        contentReadsNo,
        totalCourseNo,
      );

      // @ts-ignore
      result[index].course.assessment = {
        total: totalCourseAssessmentNo,
        done: doneAssessments,
      };
    }

    return {
      data: result,
      count: total,
    };
  }
}
