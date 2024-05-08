import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { IProgram, Programs } from './entities/program.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import { Public } from 'src/auth/decorators/auth.decorator';

@Controller('v1/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  /**
   * Create program endpoint
   * @param createProgramDto
   * @returns
   */
  @Post('create')
  @Roles(UserRole.ADMIN)
  create(@Body() createProgramDto: CreateProgramDto): Promise<GenericPayload> {
    return this.programsService.create(createProgramDto);
  }

  /**
   * View programs endpoint
   * @param filter
   * @returns
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query() filter: GenericFilter & IProgram,
  ): Promise<PagePayload<Programs>> {
    return this.programsService.findAll(filter);
  }

  /**
   * View programs endpoint (client)
   * @param filter
   * @returns
   */
  @Get('fetch-programs')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  fetchPrograms(
    @Query() filter: GenericFilter & IProgram,
  ): Promise<PagePayload<Programs>> {
    return this.programsService.fetchPrograms(filter);
  }

  /**
   * View programs endpoint
   * @param filter
   * @returns
   */
  @Get('public')
  @Public()
  findAllPublic(
    @Query() filter: GenericFilter & IProgram,
  ): Promise<PagePayload<Programs>> {
    return this.programsService.findAllPublic(filter);
  }

  /**
   * View program endpoint by id
   * @param programIdDto
   * @returns
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param() programIdDto: IdDto): Promise<Programs | null> {
    return this.programsService.findOne(programIdDto['id']);
  }

  /**
   * Update program endpoint
   * @param programIdDto
   * @param updateProgramDto
   * @returns
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param() programIdDto: IdDto,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(programIdDto, updateProgramDto);
  }

  /**
   * Delete program endpoint
   * @param programIdDto
   * @returns
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param() programIdDto: IdDto) {
    return this.programsService.remove(programIdDto);
  }
}
