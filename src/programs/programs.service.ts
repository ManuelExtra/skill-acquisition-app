import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { InjectRepository } from '@nestjs/typeorm';
import { IProgram, Programs } from './entities/program.entity';
import { Like, Repository } from 'typeorm';
import { PageService } from 'src/generic/pagination/page.service';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { IdDto } from 'src/generic/dto/generic.dto';

@Injectable()
export class ProgramsService extends PageService {
  constructor(
    @InjectRepository(Programs)
    private programsRepository: Repository<Programs>,
    private readonly programs: Programs,
  ) {
    super();
  }

  /**
   * A private method for creating a program where query
   * @param params
   * @returns
   */
  private createProgramWhereQuery(params: IProgram) {
    const where: any = {};

    if (params.title) {
      where.title = Like(`%${params.title}%`);
    }

    if (params.published) {
      where.isPublished = Boolean(+params.published);
    }

    return where;
  }

  /**
   * Create program
   * @param createProgramDto
   * @returns
   */
  async create(createProgramDto: CreateProgramDto): Promise<GenericPayload> {
    const { title } = createProgramDto;

    const program = this.programs.create(createProgramDto);

    // Check program by title
    const savedProgram = await this.programsRepository.findOne({
      where: { title },
    });

    if (savedProgram) {
      throw new UnprocessableEntityException(
        `Program with this title '${title}' already exists.`,
      );
    }

    await this.programsRepository.save(program);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Program created successfully',
    };
  }

  /**
   * View programs (with pagination)
   * @param filter
   * @returns
   */
  async findAll(
    filter: GenericFilter & IProgram,
  ): Promise<PagePayload<Programs>> {
    const { ...params } = filter;

    const [results, total] = await this.paginate(
      this.programsRepository,
      filter,
      this.createProgramWhereQuery(params),
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * View programs (with pagination) | fetch for clients
   * @param filter
   * @returns
   */
  async fetchPrograms(
    filter: GenericFilter & IProgram,
  ): Promise<PagePayload<Programs>> {
    const { ...params } = filter;

    const [results, total] = await this.paginateWithSelect(
      this.programsRepository,
      filter,
      this.createProgramWhereQuery(params),
      ['id', 'title'],
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * View programs public (with pagination)
   * @param filter
   * @returns
   */
  async findAllPublic(
    filter: GenericFilter & IProgram,
  ): Promise<PagePayload<Programs>> {
    const { ...params } = filter;

    const relations = {
      courses: true,
    };

    const where = {
      ...this.createProgramWhereQuery(params),
      isPublished: true,
      courses: {
        isPublished: true,
      },
    };

    // Specify page size
    filter.pageSize = 6;

    const [results, total] = await this.paginateRel(
      this.programsRepository,
      filter,
      where,
      relations,
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * View program with id
   * @param id
   * @returns
   */
  async findOne(id: IdDto['id']): Promise<Programs | null> {
    const program = await this.programsRepository.findOneBy({ id });

    if (!program) {
      throw new NotFoundException('Program not found');
    }
    return program;
  }

  /**
   * Update program
   * @param programIdDto
   * @param updateProgramDto
   * @returns
   */
  async update(
    programIdDto: IdDto,
    updateProgramDto: UpdateProgramDto,
  ): Promise<GenericPayload> {
    const { id } = programIdDto;

    // Check program
    const program = await this.findOne(id);

    Object.keys(updateProgramDto).forEach((item) => {
      program[item] = updateProgramDto[item];
    });

    await this.programsRepository.save(program);

    return {
      statusCode: HttpStatus.OK,
      message: 'Program updated successfully.',
    };
  }

  /**
   * Delete program (only unpublished ones)
   * @param programIdDto
   * @returns
   */
  async remove(programIdDto: IdDto): Promise<GenericPayload> {
    const { id } = programIdDto;
    const program = await this.findOne(id);

    if (program.isPublished) {
      throw new UnprocessableEntityException(
        'Program published cannot be deleted.',
      );
    }

    await this.programsRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Program removed successfully.',
    };
  }
}
