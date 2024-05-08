import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Public } from './decorators/auth.decorator';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './auth.service';
import {
  AuthPayload,
  ResetPassword,
  ResetPasswordReq,
  SigninUser,
  UpdatePassword,
  UpdateProfile,
} from './entities/auth.entity';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() signinAuthDto: SigninUser) {
    return this.authService.signIn(signinAuthDto);
  }

  @Get('verify-email')
  verifyEmail(@Request() req: AuthPayload) {
    return this.authService.verifyEmail(req.user);
  }

  @Get('profile')
  getProfile(@Request() req: AuthPayload) {
    return this.authService.getProfile(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('reset-password-request')
  requestPasswordReset(@Body() resetPassReqDto: ResetPasswordReq) {
    return this.authService.requestPasswordReset(resetPassReqDto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(
    @Request() req: AuthPayload,
    @Body() resetPasswordDto: ResetPassword,
  ) {
    return this.authService.resetPassword(req.user, resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('update-password')
  updatePassword(
    @Request() req: AuthPayload,
    @Body() updatePasswordDto: UpdatePassword,
  ) {
    return this.authService.updatePassword(req.user, updatePasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('update-profile')
  updateProfile(
    @Request() req: AuthPayload,
    @Body() updateProfileDto: UpdateProfile,
  ) {
    return this.authService.updateProfile(req.user, updateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signout')
  signout(@Request() req: AuthPayload) {
    return this.authService.signout(req.user);
  }
}
