import { compareSync } from 'bcrypt';
import { IsOptional, IsString } from 'class-validator';
import { IdDto } from 'src/generic/dto/generic.dto';
import { UserRole } from 'src/users/entities/user.entity';

// Payloads
export class AuthSchema {
  accessToken: string;
  refreshToken?: string;
  data: AuthPayload['data'];
}

export class AuthGenericPayload {
  statusCode: number;
  message: string;
}

export interface AuthPayload {
  user: {
    sub: string;
    email: string;
    role: UserRole;
  };
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
}

// Handy methods
export class Auth {
  constructor() {}
  comparePassword(password: string, hash: string) {
    return compareSync(password, hash);
  }
}

// Enums
export enum Role {
  Client = 'client',
  Admin = 'admin',
  Instructor = 'instructor',
}

// Validators
export class SigninUser {
  @IsString()
  email: string;

  @IsString()
  password: string;
}

export class ResetPasswordReq {
  @IsString()
  email: string;
}

export class ResetPassword {
  @IsString()
  newPassword: string;

  @IsString()
  newPasswordConfirmation: string;
}

export class UpdatePassword {
  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;

  @IsString()
  newPasswordConfirmation: string;
}

export class UpdateProfile {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  picture: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  facebookUrl: string;

  @IsOptional()
  @IsString()
  twitterUrl: string;

  @IsOptional()
  @IsString()
  linkedinUrl: string;

  @IsOptional()
  @IsString()
  bio: string;
}
