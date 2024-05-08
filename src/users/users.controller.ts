import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUser, IUser, UserRole } from './entities/user.entity';
import { Public } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { SendMessageDto } from './dto/send-message.dto';
import { GenericPayload } from 'src/generic/generic.payload';
import { IdDto } from 'src/generic/dto/generic.dto';

@Controller('v1/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('admin/create')
  @Roles(UserRole.ADMIN)
  createAdmin(@Body() createUserDto: CreateUser) {
    return this.usersService.createSubAdmin(createUserDto);
  }

  @Public()
  @Post('client/signup') // Client === host or guest
  signup(@Body() createUserDto: CreateUser) {
    return this.usersService.signup(createUserDto);
  }

  /**
   * Fetch clients based on their roles
   * @param clientDto
   * @param filter
   * @returns
   */
  // @Roles(UserRole.ADMIN, UserRole.SUBADMIN)
  // @Get('clients/:role')
  // getClients(
  //   @Param() clientDto: FetchClientDto,
  //   @Query() filter: GenericFilter & IUser,
  // ) {
  //   return this.usersService.clients(filter, clientDto.role);
  // }

  /**
   * Validate host
   * @param user
   * @returns
   */
  @Roles(UserRole.ADMIN, UserRole.SUBADMIN)
  @Patch('validate-host/:id')
  validateHost(@Param() user: IdDto) {
    return this.usersService.validateHost(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('subadmins')
  getSubAdmins(@Query() filter: GenericFilter & IUser) {
    return this.usersService.subadministrators(filter);
  }

  @Roles(UserRole.ADMIN)
  @Get('instructor/:id')
  getInstructor(@Param('id') id: string) {
    return this.usersService.instructor(id);
  }

  @Roles(UserRole.ADMIN)
  @Get('student/:id')
  getStudent(@Param('id') id: string) {
    return this.usersService.student(id);
  }

  @Roles(UserRole.ADMIN)
  @Get('subadministrator/:id')
  getSubadministrator(@Param('id') id: string) {
    return this.usersService.subadministrator(id);
  }

  @Post('send-contact-message')
  @Public()
  sendMessage(@Body() sendMessageDto: SendMessageDto): Promise<GenericPayload> {
    return this.usersService.sendMessage(sendMessageDto);
  }
}
