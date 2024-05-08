import { IdDto } from 'src/generic/dto/generic.dto';
import { Orders } from 'src/orders/entities/orders.entity';
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
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { courseNarration, generateTrxNumber } from '../transactions.utils';

// Interfaces
export interface ICourseTrx {
  user: IdDto['id'];
  amount: number;
  subAmount: number;
  courseNo: number;
  thirdPartyRef: string;
}
export interface ITrx {
  reference: string;
  thirdPartyRef: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Enums
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
export enum TransactionPurpose {
  COURSE = 'course-payment',
}
export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => Users, (user) => user.transactions)
  user: Users['id'];

  @Column()
  reference: string;

  @Column()
  thirdPartyRef: string;

  @Column({ default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'double' })
  amount: number;

  @Column({ type: 'double' })
  subAmount: number;

  @Column()
  narration: string;

  @Column({ default: PaymentGateway.PAYPAL })
  gateway: PaymentGateway;

  @Column({ default: TransactionPurpose.COURSE })
  purpose: TransactionPurpose;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;

  createCourseTrx(createTrx: ICourseTrx): Transactions {
    const transaction = new Transactions();

    transaction.narration = courseNarration(createTrx.courseNo);
    transaction.amount = +createTrx.amount.toFixed(2);
    transaction.subAmount = +createTrx.subAmount.toFixed(2);
    transaction.reference = generateTrxNumber();
    transaction.thirdPartyRef = createTrx.thirdPartyRef;
    transaction.user = createTrx.user;

    return transaction;
  }

  toJSON() {
    delete this.updatedDate;
    delete this.deletedDate;

    return this;
  }
}
