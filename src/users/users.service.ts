import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ArrayContains } from 'typeorm';
import { genSaltSync, hashSync } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  CreateUser,
  Users,
  UserDoc,
  UserRole,
  UserSchema,
  IUser,
} from './entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { PageService } from 'src/generic/pagination/page.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { IdDto } from 'src/generic/dto/generic.dto';

@Injectable()
export class UsersService extends PageService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
    private mailService: MailService,
    private jwtService: JwtService,
    private userDoc: UserDoc,
  ) {
    super();
  }

  /**
   * A private method for creating a user where query
   * @param params
   * @param role
   * @returns
   */
  private createUserWhereQuery(params: IUser, role: UserRole) {
    const where: any = {};

    if (params.firstName) {
      where.firstName = Like(`%${params.firstName}%`);
    }

    if (params.lastName) {
      where.lastName = Like(`%${params.lastName}%`);
    }

    if (params.email) {
      where.email = Like(`%${params.email}%`);
    }

    if (params.phone) {
      where.phone = Like(`%${params.phone}%`);
    }

    if (params.active) {
      where.isActive = Boolean(+params.active);
    }

    if (params.suspended) {
      where.isSuspended = Boolean(+params.suspended);
    }

    if (params.verifiedAsHost) {
      where.verifiedAsHost = Boolean(+params.verifiedAsHost);
    }

    where.role = Like(`%${role}%`);

    return where;
  }

  // Create subadminn
  async createSubAdmin(createUserDto: CreateUser) {
    const { email, phone, password } = createUserDto;

    if (await this.usersRepository.findOneBy({ email })) {
      throw new BadRequestException('This email has been registered.');
    }

    if (await this.usersRepository.findOneBy({ phone })) {
      throw new BadRequestException('This phone number has been registered.');
    }

    const user = this.userDoc.createUser(createUserDto, UserRole.SUBADMIN);

    const savedUserInfo = await this.usersRepository.save(user);

    // Create email verification payload
    const payload = {
      sub: savedUserInfo.id,
      email: savedUserInfo.email,
      role: savedUserInfo.role,
    };

    // Generate and Save token
    const token = await this.jwtService.signAsync(payload);
    user.accessToken = token;
    const savedUser = await this.usersRepository.save(user);

    // Send email
    await this.mailService.sendUserConfirmationWithCredentials(
      {
        name: savedUser.firstName,
        email: savedUser.email,
        password: password,
      },
      token,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Admin account created successfully.',
    };
  }

  // Create host
  // async createHost(createUserDto: CreateUser) {
  //   const { email, phone, password } = createUserDto;

  //   if (await this.usersRepository.findOneBy({ email })) {
  //     throw new BadRequestException('This email has been registered.');
  //   }

  //   if (await this.usersRepository.findOneBy({ phone })) {
  //     throw new BadRequestException('This phone number has been registered.');
  //   }

  //   const user = this.userDoc.createUser(createUserDto, UserRole.HOST);

  //   const savedUserInfo = await this.usersRepository.save(user);

  //   // Create email verification payload
  //   const payload = {
  //     sub: savedUserInfo.id,
  //     email: savedUserInfo.email,
  //     role: savedUserInfo.role,
  //   };

  //   // Generate and Save token
  //   const token = await this.jwtService.signAsync(payload);
  //   user.accessToken = token;
  //   const savedUser = await this.usersRepository.save(user);

  //   // Send email
  //   await this.mailService.sendUserConfirmationWithCredentials(
  //     {
  //       name: savedUser.firstName,
  //       email: savedUser.email,
  //       password: password,
  //     },
  //     token,
  //   );

  //   return {
  //     statusCode: HttpStatus.CREATED,
  //     message: 'Host account created successfully.',
  //   };
  // }

  // host & guest signup
  async signup(createUserDto: CreateUser) {
    const { email, phone } = createUserDto;

    if (await this.usersRepository.findOneBy({ email })) {
      throw new BadRequestException('This email has been registered.');
    }

    if (await this.usersRepository.findOneBy({ phone })) {
      throw new BadRequestException('This phone number has been registered.');
    }

    // Save provided details
    const user = this.userDoc.createUser(createUserDto, UserRole.STUDENT);
    const savedUserInfo = await this.usersRepository.save(user);

    // Create email verification payload
    const payload = {
      sub: savedUserInfo.id,
      email: savedUserInfo.email,
      role: savedUserInfo.role,
    };

    // Generate and Save token
    const token = await this.jwtService.signAsync(payload);
    user.accessToken = token;
    const savedUser = await this.usersRepository.save(user);

    // Send email
    await this.mailService.sendUserConfirmation(
      { name: savedUser.firstName, email: savedUser.email },
      token,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message:
        'Account creation was successful. Check your email inbox to proceed to verification.',
    };
  }

  // Get instructors
  async instructors(filter: GenericFilter & IUser) {
    const { ...params } = filter;

    const [results, total] = await this.paginate(
      this.usersRepository,
      filter,
      this.createUserWhereQuery(params, UserRole.INSTRUCTOR),
    );
    return {
      data: results,
      count: total,
    };
  }

  // Get a single instructor
  async instructor(id: string): Promise<Users | null> {
    const instructor = await this.findUser(id, UserRole.INSTRUCTOR);

    return instructor.genericInfo();
  }

  /**
   *  Get clients - Host, Guest - including upcoming and unverified hosts
   * @param filter
   * @param role
   * @returns
   */
  async clients(
    filter: GenericFilter & IUser,
    role: any,
  ): Promise<PagePayload<Users>> {
    const { ...params } = filter;

    const where = this.createUserWhereQuery(params, role);

    const [results, total] = await this.paginate(
      this.usersRepository,
      filter,
      where,
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * Validate host
   * @param id
   * @returns
   */
  async validateHost(id: IdDto['id']): Promise<GenericPayload> {
    // const user = await this.findUser(id, UserRole.HOST);

    // if (user.verifiedAsHost) {
    //   throw new BadRequestException('Host has already been validated');
    // }

    // // Automated ID verification (Future update)

    // await this.usersRepository.update({ id }, { verifiedAsHost: true });

    // // Send email notification
    // await this.mailService.sendHostValidation({
    //   email: user.email,
    //   name: user.firstName,
    // });

    return {
      statusCode: HttpStatus.OK,
      message: 'Host validated successfully.',
    };
  }

  // Get a single student
  async student(id: string): Promise<Users | null> {
    const student = await this.findUser(id, UserRole.STUDENT);

    return student.genericInfo();
  }

  // Get administrators
  async subadministrators(filter: GenericFilter & IUser) {
    const { ...params } = filter;

    const [results, total] = await this.paginate(
      this.usersRepository,
      filter,
      this.createUserWhereQuery(params, UserRole.SUBADMIN),
    );
    return {
      data: results,
      count: total,
    };
  }

  // Get a single student
  async subadministrator(id: string): Promise<Users | null> {
    const subadministrator = await this.findUser(id, UserRole.SUBADMIN);

    return subadministrator.genericInfo();
  }

  // Find user by id
  async findOne(id: string): Promise<Users | null> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new UnauthorizedException(
        'Unfortunately, you do not have an account with us',
      );
    }
    return user;
  }

  // Find user by id and role
  async findUser(id: string, role: UserRole): Promise<Users | null> {
    const where = {
      id,
      role: Like(`%${role}%`),
    };

    // @ts-ignore
    const user = await this.usersRepository.findOneBy(where);

    if (!user) {
      throw new NotFoundException('Account not found');
    }
    return user;
  }

  // Find user by email
  async findByEmail(email: string): Promise<Users | null> {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException(
        'Unfortunately, you do not have an account with us',
      );
    }

    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  // Send contact message
  async sendMessage(data: SendMessageDto): Promise<GenericPayload> {
    await this.mailService.sendContactMessage(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Contact message sent successfully.',
    };
  }
}
