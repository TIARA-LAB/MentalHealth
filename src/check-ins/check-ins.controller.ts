import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { CheckInRecordDto } from './dto/check-in-record.dto';
import { UpdateCheckInDto } from './dto/update-check-in.dto';
import { MoodCalendarQueryDto } from './dto/mood-calendar-query.dto';
import { ListCheckInsQueryDto } from './dto/list-check-ins-query.dto';

@ApiTags('Mood check-ins')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('mood-checkins')
export class CheckInsController {
  constructor(private checkInsService: CheckInsService) {}

  @ApiOperation({ summary: 'Fetch all check-in history records for the user' })
  @ApiOkResponse({
    description: 'List of check-in records',
    type: [CheckInRecordDto],
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: ListCheckInsQueryDto,
  ) {
    return this.checkInsService.findAll(userId, query.limit);
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

  @ApiOperation({ summary: "Fetch today's check-in for the user" })
  @ApiOkResponse({
    description: "Today's check-in record",
    type: CheckInRecordDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'No check-in for today' })
  @Get('today')
  findToday(@CurrentUser('id') userId: string) {
    return this.checkInsService.findToday(userId);
  }

  @ApiOperation({ summary: "Fetch the user's most recent check-in" })
  @ApiOkResponse({
    description: 'Most recent check-in record',
    type: CheckInRecordDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'No check-in found' })
  @Get('latest')
  findLatest(@CurrentUser('id') userId: string) {
    return this.checkInsService.findLatest(userId);
  }

  @ApiOperation({ summary: 'Fetch a calendar of check-ins within a range' })
  @ApiOkResponse({
    description: 'Check-ins keyed by UTC date (YYYY-MM-DD)',
    schema: {
      example: {
        '2026-08-15': {
          mood: 'THREE',
          intensity: 3,
          factors: ['sleep', 'work'],
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('calendar')
  calendar(
    @CurrentUser('id') userId: string,
    @Query() query: MoodCalendarQueryDto,
  ) {
    return this.checkInsService.calendar(userId, query.from, query.to);
  }

  @ApiOperation({ summary: 'Fetch a single check-in by id' })
  @ApiOkResponse({
    description: 'Check-in record',
    type: CheckInRecordDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Check-in not found' })
  @Get(':checkInId')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('checkInId') checkInId: string,
  ) {
    return this.checkInsService.findOne(userId, checkInId);
  }

  @ApiOperation({
    summary: 'Replace a check-in (mood, intensity, factors, notes)',
  })
  @ApiOkResponse({
    description: 'Updated check-in record',
    type: CheckInRecordDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Check-in not found' })
  @Put(':checkInId')
  update(
    @CurrentUser('id') userId: string,
    @Param('checkInId') checkInId: string,
    @Body() dto: UpdateCheckInDto,
  ) {
    return this.checkInsService.update(userId, checkInId, dto);
  }

  @ApiOperation({ summary: 'Partially update a check-in' })
  @ApiOkResponse({
    description: 'Updated check-in record',
    type: CheckInRecordDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Check-in not found' })
  @Patch(':checkInId')
  patch(
    @CurrentUser('id') userId: string,
    @Param('checkInId') checkInId: string,
    @Body() dto: UpdateCheckInDto,
  ) {
    return this.checkInsService.update(userId, checkInId, dto);
  }

  @ApiOperation({ summary: 'Delete a check-in' })
  @ApiOkResponse({
    description: 'Check-in deleted',
    schema: { example: { message: 'Check-in deleted successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Check-in not found' })
  @Delete(':checkInId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('checkInId') checkInId: string,
  ) {
    return this.checkInsService.remove(userId, checkInId);
  }
}
