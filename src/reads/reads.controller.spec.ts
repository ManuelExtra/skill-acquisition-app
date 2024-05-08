import { Test, TestingModule } from '@nestjs/testing';
import { ReadsController } from './reads.controller';
import { ReadsService } from './reads.service';

describe('ReadsController', () => {
  let controller: ReadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadsController],
      providers: [ReadsService],
    }).compile();

    controller = module.get<ReadsController>(ReadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
