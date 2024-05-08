import { UUID } from 'crypto';
import { IdDto } from 'src/generic/dto/generic.dto';
import { UserRole, Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateNotificationDto } from '../dto/create-notification.dto';

// Interfaces
export interface INotification {
  read?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  userGroup?: UserRole;
}

// Models
@Entity()
export class Notifications {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  read: boolean;

  @ManyToOne((type) => Users, (user) => user.notifications)
  user: Users['id'] | null;

  @Column()
  userGroup: UserRole;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(
    createNotificationDto: CreateNotificationDto,
    userId?: string | undefined,
  ): Notifications {
    const notification = new Notifications();

    notification.title = createNotificationDto.title;
    notification.body = createNotificationDto.body;
    notification.userGroup = createNotificationDto.userGroup;

    notification.user = userId;

    return notification;
  }

  // prepareMany(
  //   createNotificationDto: CreateNotificationDto[],
  // ): Notifications {
  //   const notification = new Notifications();

  //   notification.title = createNotificationDto.title;
  //   notification.body = createNotificationDto.body;
  //   notification.userGroup = createNotificationDto.userGroup;

  //   notification.user = userId;

  //   return notification;
  // }

  toJSON() {
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
