import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PutUserDto } from './dto/put-user.dto';
import { AvatarDto } from './dto/avatar.dto';
import { WellnessGoalsDto } from './dto/wellness-goals.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({
    description: 'Current user profile',
    schema: {
      example: {
        id: 'uuid',
        email: 'jane.doe@example.com',
        name: 'Jane Doe',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({
    description: 'Updated user profile',
    schema: {
      example: {
        id: 'uuid',
        email: 'jane.doe@example.com',
        name: 'Jane Doe',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid body (e.g. malformed email)' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @ApiOperation({ summary: 'Change the authenticated user password' })
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
  @Patch('me/password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @ApiOperation({ summary: 'Soft delete the authenticated user account' })
  @ApiOkResponse({
    description: 'Account soft-deleted',
    schema: { example: { message: 'Account deleted successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Delete('me')
  softDelete(@CurrentUser('id') userId: string) {
    return this.usersService.softDelete(userId);
  }

  @ApiOperation({ summary: 'Replace the authenticated user profile' })
  @ApiOkResponse({
    description: 'Replaced user profile',
    schema: {
      example: {
        id: 'uuid',
        email: 'jane.doe@example.com',
        name: 'Jane Doe',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid body (missing name or malformed email)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Put('me')
  replaceMe(@CurrentUser('id') userId: string, @Body() dto: PutUserDto) {
    return this.usersService.replaceMe(userId, dto);
  }

  @ApiOperation({ summary: 'Set the authenticated user avatar' })
  @ApiCreatedResponse({
    description: 'Avatar updated',
    schema: {
      example: { avatarUrl: 'https://cdn.example.com/avatars/jane.png' },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid body (malformed avatar URL)' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Post('me/avatar')
  updateAvatar(@CurrentUser('id') userId: string, @Body() dto: AvatarDto) {
    return this.usersService.updateAvatar(userId, dto);
  }

  @ApiOperation({ summary: 'Remove the authenticated user avatar' })
  @ApiOkResponse({
    description: 'Avatar removed',
    schema: { example: { avatarUrl: null } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Delete('me/avatar')
  removeAvatar(@CurrentUser('id') userId: string) {
    return this.usersService.removeAvatar(userId);
  }

  @ApiOperation({ summary: 'Get the authenticated user wellness goals' })
  @ApiOkResponse({
    description: 'Wellness goals or null',
    schema: {
      example: {
        id: 'uuid',
        goals: ['Meditate daily', 'Sleep 8 hours'],
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('me/wellness-goals')
  getWellnessGoals(@CurrentUser('id') userId: string) {
    return this.usersService.getWellnessGoals(userId);
  }

  @ApiOperation({
    summary: 'Create or replace the authenticated user wellness goals',
  })
  @ApiOkResponse({
    description: 'Wellness goals saved',
    schema: {
      example: {
        id: 'uuid',
        goals: ['Meditate daily', 'Sleep 8 hours'],
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid body (missing goals)' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Put('me/wellness-goals')
  putWellnessGoals(
    @CurrentUser('id') userId: string,
    @Body() dto: WellnessGoalsDto,
  ) {
    return this.usersService.putWellnessGoals(userId, dto);
  }

  @ApiOperation({ summary: 'Remove the authenticated user wellness goals' })
  @ApiOkResponse({
    description: 'Wellness goals removed',
    schema: { example: { message: 'Wellness goals removed' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Delete('me/wellness-goals')
  removeWellnessGoals(@CurrentUser('id') userId: string) {
    return this.usersService.removeWellnessGoals(userId);
  }

  @ApiOperation({
    summary: 'Request a full data export of the authenticated user',
  })
  @ApiCreatedResponse({
    description: 'Data export created',
    schema: {
      example: {
        id: 'uuid',
        status: 'READY',
        requestedAt: '2026-09-16T10:00:00.000Z',
        completedAt: '2026-09-16T10:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Post('me/export')
  createExport(@CurrentUser('id') userId: string) {
    return this.usersService.createExport(userId);
  }

  @ApiOperation({
    summary: 'Get a data export owned by the authenticated user',
  })
  @ApiOkResponse({
    description: 'Data export',
    schema: {
      example: {
        id: 'uuid',
        status: 'READY',
        requestedAt: '2026-09-16T10:00:00.000Z',
        completedAt: '2026-09-16T10:00:00.000Z',
        payload: {},
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Export not found' })
  @Get('me/export/:exportId')
  getExport(
    @CurrentUser('id') userId: string,
    @Param('exportId') exportId: string,
  ) {
    return this.usersService.getExport(userId, exportId);
  }
}
