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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { JournalEntryDto } from './dto/journal-entry.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { SearchJournalQueryDto } from './dto/search-journal.query';
import { JournalCalendarQueryDto } from './dto/journal-calendar-query.dto';
import { ListJournalQueryDto } from './dto/list-journal-query.dto';

@ApiTags('Journal entries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller(['journal-entries', 'journal'])
export class JournalController {
  constructor(private journalService: JournalService) {}

  @ApiOperation({
    summary: 'Fetch all non-archived journal entries for the user',
  })
  @ApiOkResponse({
    description: 'List of journal entries',
    type: [JournalEntryDto],
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: ListJournalQueryDto,
  ) {
    return this.journalService.findAll(
      userId,
      query.includeArchived,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiCreatedResponse({
    description: 'Journal entry created',
    type: JournalEntryDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid body (missing title/content, oversized title or tags)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateJournalDto) {
    return this.journalService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Search journal entries by title and content' })
  @ApiOkResponse({
    description: 'Matching journal entries',
    type: [JournalEntryDto],
  })
  @ApiBadRequestResponse({ description: 'Missing or empty `q` query param' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('search')
  search(
    @CurrentUser('id') userId: string,
    @Query() query: SearchJournalQueryDto,
  ) {
    return this.journalService.search(userId, query);
  }

  @ApiOperation({ summary: 'Fetch entry counts per day within a range' })
  @ApiOkResponse({
    description: 'Daily entry counts for non-archived entries',
    schema: {
      example: [{ date: '2026-08-15', count: 2 }],
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('calendar')
  calendar(
    @CurrentUser('id') userId: string,
    @Query() query: JournalCalendarQueryDto,
  ) {
    return this.journalService.calendar(userId, query.from, query.to);
  }

  @ApiOperation({ summary: 'Fetch a single journal entry by id' })
  @ApiOkResponse({
    description: 'Journal entry',
    type: JournalEntryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Journal entry not found' })
  @Get(':entryId')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.journalService.findOne(userId, entryId);
  }

  @ApiOperation({ summary: 'Replace a journal entry' })
  @ApiOkResponse({
    description: 'Updated journal entry',
    type: JournalEntryDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Journal entry not found' })
  @Put(':entryId')
  update(
    @CurrentUser('id') userId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalService.update(userId, entryId, dto);
  }

  @ApiOperation({ summary: 'Partially update a journal entry' })
  @ApiOkResponse({
    description: 'Updated journal entry',
    type: JournalEntryDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid body' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Journal entry not found' })
  @Patch(':entryId')
  patch(
    @CurrentUser('id') userId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalService.update(userId, entryId, dto);
  }

  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiOkResponse({
    description: 'Journal entry deleted',
    schema: { example: { message: 'Journal entry deleted successfully' } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Journal entry not found' })
  @Delete(':entryId')
  remove(@CurrentUser('id') userId: string, @Param('entryId') entryId: string) {
    return this.journalService.remove(userId, entryId);
  }

  @ApiOperation({ summary: 'Archive a journal entry' })
  @ApiOkResponse({
    description: 'Archived journal entry',
    type: JournalEntryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Journal entry not found' })
  @Post(':entryId/archive')
  archive(
    @CurrentUser('id') userId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.journalService.archive(userId, entryId);
  }

  @ApiOperation({ summary: 'Restore an archived journal entry' })
  @ApiOkResponse({
    description: 'Restored journal entry',
    type: JournalEntryDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiNotFoundResponse({ description: 'Journal entry not found' })
  @Post(':entryId/restore')
  restore(
    @CurrentUser('id') userId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.journalService.restore(userId, entryId);
  }
}
