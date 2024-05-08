import { Courses } from 'src/courses/entities/course.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateOrderItemDto, ICourse } from '../dto/create-order.dto';
import { Orders } from './orders.entity';

// Interfaces
export interface ICreateOrderItem {
  course: IdDto['id'];
  order: IdDto['id'];
  price: number;
}
export interface ICourseOrderItem {
  course: { title: string; price: string };
  price: string;
}

// Models
@Entity()
export class OrderItems {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => Courses, (course) => course.orderItems)
  course: Courses['id'];

  @ManyToOne((type) => Orders, (order) => order.orderItems)
  order: Orders['id'];

  @Column({ type: 'double' })
  price: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  collect(createOrderItemDto: CreateOrderItemDto): ICreateOrderItem[] {
    const { courses, order } = createOrderItemDto;

    const orderItems = courses.map((course) => {
      return {
        course: course.id,
        price: +course.price.toFixed(2),
        order,
      };
    });

    return orderItems;
  }

  toJSON() {
    delete this.createdDate;
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
