import { IdDto } from 'src/generic/dto/generic.dto';
import { Transactions } from 'src/transactions/entities/transactions.entity';
import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { generateOrderNumber } from '../orders.utils';
import { OrderItems } from './order-items.entity';

// Enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

// Interfaces
export interface ICreateOrder {
  buyer: IdDto['id'];
  trx: IdDto['id'];
}
export interface IOrder {
  status: OrderStatus;
  trx: {
    reference: string;
    thirdPartyRef: string;
  };
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}
export interface IOrderItem {
  course: {
    title: string;
  };
  order: {
    status: OrderStatus;
  };
}

// Models
@Entity()
export class Orders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  number: string;

  @ManyToOne((type) => Users, (buyer) => buyer.orders)
  buyer: Users['id'];

  @OneToOne((type) => Transactions)
  @JoinColumn()
  trx: Transactions['id'];

  @OneToMany((type) => OrderItems, (orderItem) => orderItem.order)
  orderItems: OrderItems[];

  @Column({ default: OrderStatus.PENDING })
  status: OrderStatus;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  create(createOrder: ICreateOrder): Orders {
    const order = new Orders();

    order.number = generateOrderNumber();
    order.buyer = createOrder.buyer;
    order.trx = createOrder.trx;

    return order;
  }

  toJSON() {
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
