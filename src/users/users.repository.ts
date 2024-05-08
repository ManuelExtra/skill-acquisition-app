import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseRepository } from 'src/generic/transaction/base-repository';
import { DataSource } from 'typeorm';
import { CreateUser, UserRole, Users } from './entities/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class ProductsRepository extends BaseRepository {
  constructor(dataSource: DataSource, @Inject(REQUEST) req: Request) {
    super(dataSource, req);
  }

  async findUserBy(data: any) {
    return await this.getRepository(Users).findOneBy(data);
  }

  async createUser(data: Users) {
    return await this.getRepository(Users).save(data);
  }
}
