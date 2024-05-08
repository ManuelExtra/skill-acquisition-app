import { Test, TestingModule } from '@nestjs/testing';
import { ReadsService } from './reads.service';

describe('ReadsService', () => {
  let service: ReadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadsService],
    }).compile();

    service = module.get<ReadsService>(ReadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
