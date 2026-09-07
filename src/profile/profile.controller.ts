import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import { UserProfileDto } from './dto/profile-response.dto';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @ApiOperation({
    summary: 'Get the current authenticated user profile and streak details',
  })
  @ApiOkResponse({
    description: 'The user profile with streak details',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Get()
  getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Update settings for the user profile' })
  @ApiOkResponse({
    description: 'The updated user profile with streak details',
    type: UserProfileDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid body (unknown field, oversized bio, non-object preferences)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Patch('settings')
  updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileSettingsDto,
  ) {
    return this.profileService.updateSettings(userId, dto);
  }
}
