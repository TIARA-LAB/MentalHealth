import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
}
