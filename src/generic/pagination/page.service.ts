import { QueryRunner, Repository } from 'typeorm';
import { GenericFilter, SortOrder } from './generic-filter';

export class PageService {
  protected createOrderQuery(filter: GenericFilter) {
    const order: any = {};

    if (filter.orderBy) {
      order[filter.orderBy] = filter.sortOrder;
      return order;
    }

    order.createdDate = SortOrder.DESC;
    return order;
  }

  protected paginate<T>(
    repository: Repository<T>,
    filter: GenericFilter,
    where?: any | undefined,
  ) {
    filter.page = filter.page || 1;
    filter.pageSize = filter.pageSize || 10;

    return repository.findAndCount({
      order: this.createOrderQuery(filter),
      skip: (+filter.page - 1) * +filter.pageSize,
      take: +filter.pageSize,
      where: where,
    });
  }

  protected paginateWithSelect<T>(
    repository: Repository<T>,
    filter: GenericFilter,
    where: any,
    select: any,
  ) {
    filter.page = filter.page || 1;
    filter.pageSize = filter.pageSize || 10;
    return repository.findAndCount({
      order: this.createOrderQuery(filter),
      skip: (+filter.page - 1) * +filter.pageSize,
      take: +filter.pageSize,
      where: where,
      select: select,
    });
  }

  protected paginateRel<T>(
    // @ts-ignore
    repository: Repository<T>,
    filter: GenericFilter,
    where: any,
    relations: any,
  ) {
    filter.page = filter.page || 1;
    filter.pageSize = filter.pageSize || 10;
    return repository.findAndCount({
      order: this.createOrderQuery(filter),
      skip: (+filter.page - 1) * +filter.pageSize,
      take: +filter.pageSize,
      where: where,
      relations: relations,
    });
  }

  protected paginateRelWithSelect<T>(
    // @ts-ignore
    repository: Repository<T>,
    filter: GenericFilter,
    where: any,
    relations: any,
    select: any,
    allowTrx?: boolean,
    model?: new () => T,
    queryRunner?: QueryRunner,
  ) {
    filter.page = filter.page || 1;
    filter.pageSize = filter.pageSize || 10;

    return allowTrx
      ? queryRunner.manager.findAndCount(model, {
          order: this.createOrderQuery(filter),
          skip: (+filter.page - 1) * +filter.pageSize,
          take: +filter.pageSize,
          where: where,
          relations: relations,
          select: select,
        })
      : repository.findAndCount({
          order: this.createOrderQuery(filter),
          skip: (+filter.page - 1) * +filter.pageSize,
          take: +filter.pageSize,
          where: where,
          relations: relations,
          select: select,
        });
  }
}
