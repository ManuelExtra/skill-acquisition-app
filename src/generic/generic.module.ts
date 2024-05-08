import { Module } from '@nestjs/common';
import { GenericService } from './generic.service';
import { PageService } from './pagination/page.service';

@Module({
  providers: [GenericService, PageService],
  exports: [GenericService, PageService],
})
export class GenericModule {}
