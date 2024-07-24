import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { UserDoc, Users } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import {
  Auth,
  AuthGenericPayload,
  AuthPayload,
  AuthSchema,
  ResetPassword,
  SigninUser,
  UpdatePassword,
  UpdateProfile,
} from './entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
    private userDoc: UserDoc,
    private usersService: UsersService,
    private mailService: MailService,
    private auth: Auth,
    private jwtService: JwtService,
  ) {}

  // signin
  async signIn(signinAuthDto: SigninUser): Promise<AuthSchema> {
    const { email, password } = signinAuthDto;
    const user = await this.usersService.findByEmail(email);

    if (!this.auth.comparePassword(password, user.password)) {
      throw new BadRequestException('Invalid password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has not been verified.');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Your account has been suspended.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    // Generate token
    const token = await this.jwtService.signAsync(payload);

    const data = user.basicInfo();

    return {
      accessToken: token,
      data,
    };
  }

  // verify email address
  async verifyEmail(data: AuthPayload['user']): Promise<AuthGenericPayload> {
    const { sub } = data;

    const user = await this.usersService.findOne(sub);

    if (!user.isActive) {
      user.isActive = true;
      await this.usersRepository.save(user);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully.',
    };
  }

  // get profile details
  async getProfile(data: AuthPayload['user']) {
    const { sub } = data;

    const user = await this.usersService.findOne(sub);

    return user.genericInfo();
  }

  // reset password request
  async requestPasswordReset(email: string): Promise<AuthGenericPayload> {
    const user = await this.usersService.findByEmail(email);

    // Create email verification payload
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Generate token
    const token = await this.jwtService.signAsync(payload);

    // Send password reset request mail
    await this.mailService.sendResetPasswordReset(
      { name: user.firstName, email: user.email },
      token,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset request sent successfully.',
    };
  }

  // reset password
  async resetPassword(
    data: AuthPayload['user'],
    body: ResetPassword,
  ): Promise<AuthGenericPayload> {
    const { sub } = data;
    const { newPassword, newPasswordConfirmation } = body;

    const user = await this.usersService.findOne(sub);

    // Check the supplied passwords
    if (newPassword !== newPasswordConfirmation) {
      throw new UnprocessableEntityException('Password mismatch error.');
    }

    // Hash and save password
    user.password = this.userDoc.hashPassword(newPassword);
    await this.usersRepository.save(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Password saved successfully.',
    };
  }

  // Update password
  async updatePassword(
    data: AuthPayload['user'],
    body: UpdatePassword,
  ): Promise<AuthGenericPayload> {
    const { sub } = data;
    const { oldPassword, newPassword, newPasswordConfirmation } = body;

    const user = await this.usersService.findOne(sub);

    // Check password similarity
    if (!user.isPasswordSame(oldPassword)) {
      throw new BadRequestException('Old password is incorrect.');
    }

    // Check the supplied passwords
    if (newPassword !== newPasswordConfirmation) {
      throw new UnprocessableEntityException('Password mismatch error.');
    }

    // Hash and save password
    user.password = this.userDoc.hashPassword(newPassword);
    await this.usersRepository.save(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully.',
    };
  }

  // Update profile
  async updateProfile(
    data: AuthPayload['user'],
    body: UpdateProfile,
  ): Promise<AuthGenericPayload> {
    const { sub } = data;
    const {
      firstName,
      lastName,
      picture,
      address,
      facebookUrl,
      twitterUrl,
      linkedinUrl,
      bio,
    } = body;

    let user = await this.usersService.findOne(sub);

    // Save profile info
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
    }
    if (picture) {
      user.picture = picture;
    }
    if (address) {
      user.address = address;
    }
    if (facebookUrl) {
      user.facebookUrl = facebookUrl;
    }
    if (twitterUrl) {
      user.twitterUrl = twitterUrl;
    }
    if (linkedinUrl) {
      user.linkedinUrl = linkedinUrl;
    }
    if (bio) {
      user.bio = bio;
    }
    await this.usersRepository.save(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully.',
    };
  }

  // signout
  async signout(data: AuthPayload['user']): Promise<AuthGenericPayload> {
    const { sub } = data;

    let user = await this.usersService.findOne(sub);

    // Remove access token
    user.accessToken = null;
    await this.usersRepository.save(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Logout successful.',
    };
  }
}
