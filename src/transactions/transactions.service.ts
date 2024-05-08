import {
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageService } from 'src/generic/pagination/page.service';
import { Like, QueryRunner, Repository } from 'typeorm';
import {
  ICourseTrx,
  ITrx,
  Transactions,
  TransactionStatus,
} from './entities/transactions.entity';

@Injectable()
export class TransactionsService extends PageService {
  constructor(
    @InjectRepository(Transactions)
    private readonly transactionsRepository: Repository<Transactions>,
    private readonly transactions: Transactions,
  ) {
    super();
  }

  /**
   * A private method for creating a transaction where query
   * @param params
   * @returns
   */
  private createTrxWhereQuery(params: ITrx) {
    const where: any = {};

    if (params.reference) {
      where.reference = Like(`%${params.reference}%`);
    }

    if (params.thirdPartyRef) {
      where.thirdPartyRef = params.thirdPartyRef;
    }

    if (params.user) {
      where.user = {
        firstName: params.user.firstName,
        lastName: params.user.lastName,
        email: params.user.email,
      };
    }

    return where;
  }

  /**
   * Check if trx exist by trx ref
   * @param trxRef
   * @param queryRunner
   * @returns
   */
  private async doesTrxExist(
    trxRef: string,
    queryRunner: QueryRunner,
  ): Promise<boolean> {
    const trxExists = await queryRunner.manager.exists(Transactions, {
      where: {
        reference: trxRef,
      },
    });

    return trxExists;
  }

  /**
   * Create order transaction
   * @param courseTrx
   * @param queryRunner
   * @returns
   */
  async createOrderTrx(
    courseTrx: ICourseTrx,
    queryRunner: QueryRunner,
  ): Promise<Transactions> {
    // Prepare course trx data
    const transaction = this.transactions.createCourseTrx(courseTrx);

    // Check trx reference
    const trxExists = await this.doesTrxExist(
      transaction.reference,
      queryRunner,
    );
    if (trxExists) {
      throw new BadRequestException('Trx reference exists.');
    }

    // Store course trx
    await queryRunner.manager.insert(Transactions, transaction);

    return transaction;
  }

  /**
   * Confirm trx by 3rd party ref
   * @param thirdPartyRef
   * @param queryRunner
   * @returns
   */
  async confirmTrxStatusBy3rdPartyRef(
    thirdPartyRef: string,
    queryRunner: QueryRunner,
  ): Promise<Transactions> {
    // Check trx
    const trx = await queryRunner.manager.findOne(Transactions, {
      where: { thirdPartyRef },
    });

    if (!trx) {
      throw new NotFoundException('Trx not found.');
    }

    // Confirm trx
    await queryRunner.manager.update(
      Transactions,
      {
        thirdPartyRef,
      },
      { status: TransactionStatus.CONFIRMED },
    );

    return trx;
  }

  /**
   * Cancel pending transaction
   * @param param0
   * @param queryRunner
   */
  async cancelPendingTrx(
    {
      buyerId,
      orderNumber,
    }: { buyerId: string | undefined; orderNumber: string },
    queryRunner: QueryRunner,
  ): Promise<Transactions> {
    // Fetch trx details
    const trx = await queryRunner.manager.findOne(Transactions, {
      where: {
        // @ts-ignore
        user: { id: buyerId },
        thirdPartyRef: orderNumber,
        status: TransactionStatus.PENDING,
      },
    });

    if (!trx) {
      throw new NotFoundException('Trx not available for cancellation.');
    }

    // Update single trx's status to TransactionStatus.CANCELLED with criteria
    trx.status = TransactionStatus.CANCELLED;
    await queryRunner.manager.save(Transactions, trx);

    return trx;
  }

  /**
   * Cancel pending transaction - for admin
   * @param param0
   * @param queryRunner
   */
  async cancelPendingTrxForAdmin(
    { orderNumber }: { orderNumber: string },
    queryRunner: QueryRunner,
  ): Promise<Transactions> {
    // Fetch trx details
    const trx = await queryRunner.manager.findOne(Transactions, {
      where: {
        // @ts-ignore
        thirdPartyRef: orderNumber,
        status: TransactionStatus.PENDING,
      },
    });

    if (!trx) {
      throw new NotFoundException('Trx not available for cancellation.');
    }

    // Update single trx's status to TransactionStatus.CANCELLED with criteria
    trx.status = TransactionStatus.CANCELLED;
    await queryRunner.manager.save(Transactions, trx);

    return trx;
  }
}
