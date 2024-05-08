import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { UserRole } from 'src/users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { INotification } from './entities/notifications.entity';
import { NotificationsService } from './notifications.service';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Fetch student notifications
   * @param req
   * @param filter
   * @returns
   */
  @Get('/student')
  @Roles(UserRole.STUDENT)
  fetchStudentNotifications(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & INotification,
  ) {
    return this.notificationsService.fetchStudentNotifications(
      req.user,
      filter,
    );
  }

  /**
   * Fetch instructor notifications
   * @param req
   * @param filter
   * @returns
   */
  @Get('/instructor')
  @Roles(UserRole.INSTRUCTOR)
  fetchInstructorNotifications(
    @Request() req: AuthPayload,
    @Query() filter: GenericFilter & INotification,
  ) {
    return this.notificationsService.fetchInstructorNotifications(
      req.user,
      filter,
    );
  }

  /**
   * Fetch admin notifications
   * @param req
   * @param filter
   * @returns
   */
  @Get('/admin')
  @Roles(UserRole.ADMIN)
  fetchAdminNotifications(@Query() filter: GenericFilter & INotification) {
    return this.notificationsService.fetchAdminNotifications(filter);
  }

  /**
   * Fetch subadmin notifications
   * @param req
   * @param filter
   * @returns
   */
  @Get('/subadmin')
  @Roles(UserRole.SUBADMIN)
  fetchSubAdminNotifications(@Query() filter: GenericFilter & INotification) {
    return this.notificationsService.fetchSubAdminNotifications(filter);
  }

  /**
   * Mark notification as read (Only non-public notifications) - for all authorized users
   * @param req
   * @param filter
   * @returns
   */
  @Patch('/mark-as-read/:id')
  markAsRead(@Request() req: AuthPayload, @Param() notificationIdDto: IdDto) {
    return this.notificationsService.markAsRead(req.user, notificationIdDto);
  }
}
