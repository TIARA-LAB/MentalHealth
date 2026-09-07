import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

@ApiTags('Journal')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private journalService: JournalService) {}

  @ApiOperation({ summary: 'Fetch all journal entries written by the user' })
  @ApiOkResponse({
    description: 'List of journal entries',
    type: [JournalEntryDto],
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.journalService.findAll(userId);
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
}
