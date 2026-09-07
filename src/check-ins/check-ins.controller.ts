import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { CheckInRecordDto } from './dto/check-in-record.dto';

@ApiTags('Check-ins')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('check-ins')
export class CheckInsController {
  constructor(private checkInsService: CheckInsService) {}

  @ApiOperation({ summary: 'Fetch all check-in history records for the user' })
  @ApiOkResponse({
    description: 'List of check-in records',
    type: [CheckInRecordDto],
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.checkInsService.findAll(userId);
  }

  @ApiOperation({ summary: 'Submit a new daily check-in' })
  @ApiCreatedResponse({
    description: 'Check-in created',
    type: CheckInRecordDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid body (unknown field or invalid mood/date)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({
    description: 'A check-in already exists for this day',
  })
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCheckInDto) {
    return this.checkInsService.create(userId, dto);
  }
}
