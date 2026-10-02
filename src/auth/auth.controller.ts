import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RevokeSessionsDto } from './dto/revoke-sessions.dto';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Register a new user with email or phone' })
  @ApiCreatedResponse({
    description: 'User created and tokens returned',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'jane.doe@example.com',
          name: 'Jane Doe',
          phone: '+15551234567',
        },
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid body (bad email / short password / invalid phone)',
  })
  @ApiConflictResponse({ description: 'Email or phone already registered' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify email address using OTP' })
  @ApiOkResponse({
    description: 'Email verified',
    schema: { example: { message: 'Email verified successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired verification code',
  })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @ApiOperation({ summary: 'Verify phone number using OTP' })
  @ApiOkResponse({
    description: 'Phone verified',
    schema: { example: { message: 'Phone verified successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired verification code',
  })
  @Post('verify-phone')
  verifyPhone(@Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhone(dto);
  }

  @ApiOperation({ summary: 'Resend email/phone verification code' })
  @ApiOkResponse({
    description: 'Verification code sent',
    schema: { example: { message: 'Verification code sent' } },
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @ApiOperation({ summary: 'Log in using email/phone and password' })
  @ApiOkResponse({
    description: 'User authenticated and tokens returned',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'jane.doe@example.com',
          name: 'Jane Doe',
          phone: '+15551234567',
        },
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Logged out successfully',
    schema: { example: { message: 'Logged out successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refresh tokens using a valid refresh token' })
  @ApiOkResponse({
    description: 'New token pair returned',
    schema: {
      example: {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing/invalid refreshToken body' })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, expired, or the user was deleted',
  })
  @ApiForbiddenResponse({
    description: 'Refresh token is not stored, already rotated, or revoked',
  })
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  refresh(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @CurrentUser('refreshToken') rt: string,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(userId, email, dto.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refresh tokens using a valid refresh token' })
  @ApiOkResponse({
    description: 'New token pair returned',
    schema: {
      example: {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Missing/invalid refreshToken body' })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, expired, or the user was deleted',
  })
  @ApiForbiddenResponse({
    description: 'Refresh token is not stored, already rotated, or revoked',
  })
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh-token')
  refreshToken(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @CurrentUser('refreshToken') rt: string,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(userId, email, dto.refreshToken);
  }

  @ApiOperation({ summary: 'Request a password reset for an email' })
  @ApiOkResponse({
    description: 'Reset token generated (if the account exists)',
    schema: {
      example: { message: 'If that email exists, a reset link was sent' },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Set a new password using the reset token' })
  @ApiOkResponse({
    description: 'Password reset',
    schema: { example: { message: 'Password reset successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Password changed',
    schema: { example: { message: 'Password changed successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Invalid body (short new password)' })
  @ApiUnauthorizedResponse({
    description: 'Missing/invalid access token or incorrect current password',
  })
  @ApiConflictResponse({
    description: 'New password is the same as the current password',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @ApiOperation({ summary: 'View active login sessions' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'List of refresh-token sessions',
    schema: {
      example: [
        {
          id: 'uuid',
          createdAt: '2026-09-01T08:00:00.000Z',
          expiresAt: '2026-09-08T08:00:00.000Z',
          revoked: false,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  @ApiOperation({ summary: 'Revoke one active session' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Session revoked',
    schema: { example: { message: 'Session revoked successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(userId, sessionId);
  }

  @ApiOperation({ summary: 'Revoke all other sessions' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Other sessions revoked',
    schema: { example: { message: 'Other sessions revoked', revokedCount: 2 } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  revokeAllOtherSessions(
    @CurrentUser('id') userId: string,
    @Body() dto: RevokeSessionsDto,
  ) {
    return this.authService.revokeAllOtherSessions(userId, dto.keepSessionId);
  }
}
