import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { PageService } from 'src/generic/pagination/page.service';
import { UserRole } from 'src/users/entities/user.entity';
import { Equal, IsNull, Like, Or, QueryRunner, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { INotification, Notifications } from './entities/notifications.entity';

@Injectable()
export class NotificationsService extends PageService {
  constructor(
    @InjectRepository(Notifications)
    private readonly notificationsRepository: Repository<Notifications>,
    private readonly notifications: Notifications,
  ) {
    super();
  }

  /**
   * A private method for creating a notification where query
   * @param params
   * @returns
   */
  private createNotificationWhereQuery(params: INotification) {
    const where: any = {};

    if (params.user) {
      where.user = {
        id: params.user.id,
      };
    }

    if (params.read) {
      where.read = Boolean(+params.read);
    }

    if (params.userGroup) {
      where.userGroup = params.userGroup;
    }

    return where;
  }

  /**
   * Check notification availability. Notification becomes unavailable if the following is true:
   * - Wrong notification id
   * - Notification is made public some set of users (e.g: student, admin etc.)
   *    Note: Notification is public if user field is null
   * @param userId
   * @param notificationId
   */
  private async checkAuthUserNotification(
    userId: string,
    notificationId: IdDto['id'],
  ): Promise<Notifications> {
    // Check if user is authorized for access to this notification
    const authUserNotification = await this.notificationsRepository.findOne({
      where: {
        id: notificationId,
        // @ts-ignore
        user: { id: userId },
      },
    });

    if (!authUserNotification) {
      throw new BadRequestException('Notification not available.');
    }

    return authUserNotification;
  }

  /**
   * Create notification with queryRunner
   * @param createNotificationDto
   * @param queryRunner
   */
  async createNotificationWithTransaction(
    createNotificationDto: CreateNotificationDto[],
    queryRunner?: QueryRunner,
  ): Promise<void> {
    // Prepare notification data
    const bulkNotifications = queryRunner.manager.create(
      Notifications,
      createNotificationDto,
    );

    // Store
    await queryRunner.manager.insert(Notifications, bulkNotifications);
  }

  /**
   * Fetch notifications based on filters
   * @param filter
   * @returns
   */
  async viewNotifications(filter: GenericFilter & INotification) {
    const { ...params } = filter;

    const where = {
      ...this.createNotificationWhereQuery(params),
    };
    const relations = ['user'];

    const [results, total] = await this.paginateRel(
      this.notificationsRepository,
      filter,
      where,
      relations,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Fetch student notifications
   * @param user
   * @param filter
   * @returns
   */
  async fetchStudentNotifications(
    user: AuthPayload['user'],
    filter: GenericFilter & INotification,
  ): Promise<PagePayload<Notifications>> {
    const { ...params } = filter;

    const filterWhere = {
      ...this.createNotificationWhereQuery(params),
      userGroup: UserRole.STUDENT,
    };

    const where = [
      {
        user: IsNull(),
        ...filterWhere,
      },
      {
        user: { id: user.sub },
        ...filterWhere,
      },
    ];

    const [results, total] = await this.paginate(
      this.notificationsRepository,
      filter,
      where,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Fetch instructor notifications
   * @param user
   * @param filter
   * @returns
   */
  async fetchInstructorNotifications(
    user: AuthPayload['user'],
    filter: GenericFilter & INotification,
  ): Promise<PagePayload<Notifications>> {
    const { ...params } = filter;

    const filterWhere = {
      ...this.createNotificationWhereQuery(params),
      userGroup: UserRole.INSTRUCTOR,
    };

    const where = [
      {
        user: IsNull(),
        ...filterWhere,
      },
      {
        user: { id: user.sub },
        ...filterWhere,
      },
    ];

    const [results, total] = await this.paginate(
      this.notificationsRepository,
      filter,
      where,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Fetch admin notifications
   * @param user
   * @param filter
   * @returns
   */
  async fetchAdminNotifications(
    filter: GenericFilter & INotification,
  ): Promise<PagePayload<Notifications>> {
    const { ...params } = filter;

    const where = {
      ...this.createNotificationWhereQuery(params),
      userGroup: UserRole.ADMIN,
    };

    const [results, total] = await this.paginate(
      this.notificationsRepository,
      filter,
      where,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Fetch subadmin notifications
   * @param user
   * @param filter
   * @returns
   */
  async fetchSubAdminNotifications(
    filter: GenericFilter & INotification,
  ): Promise<PagePayload<Notifications>> {
    const { ...params } = filter;

    const where = {
      ...this.createNotificationWhereQuery(params),
      userGroup: UserRole.SUBADMIN,
    };

    const [results, total] = await this.paginate(
      this.notificationsRepository,
      filter,
      where,
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * Mark notification as read
   * @param user
   * @param notificationIdDto
   * @returns
   */
  async markAsRead(
    user: AuthPayload['user'],
    notificationIdDto: IdDto,
  ): Promise<GenericPayload> {
    const notification = await this.checkAuthUserNotification(
      user.sub,
      notificationIdDto.id,
    );

    if (notification.read) {
      throw new BadRequestException(
        'Notification has already been marked as read',
      );
    }

    notification.read = true;
    await this.notificationsRepository.save(notification);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notification marked as read successfully.',
    };
  }
}
