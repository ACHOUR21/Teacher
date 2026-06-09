import {
  Controller, Get, Post, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation , ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsInt, ValidateNested, Min, Max } from 'class-validator';

import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { FlashcardsService, CreateDeckDto } from '../../flashcards.service';

class CardDto {
  @ApiProperty()
  @IsString()
  front: string;

  @ApiProperty()
  @IsString()
  back: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;
}

class CreateDeckBodyDto implements CreateDeckDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ type: [CardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardDto)
  cards: CardDto[];
}

class ReviewCardBodyDto {
  @ApiProperty({ description: 'SM-2 rating 0–5 (0=blackout, 5=perfect)' })
  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;
}

@ApiTags('Flashcards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post('decks')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Create a flashcard deck (manual or AI-generated)' })
  createDeck(
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateDeckBodyDto,
  ) {
    return this.flashcardsService.createDeck(tenantId, user.id, dto);
  }

  @Get('decks')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'List accessible flashcard decks' })
  listDecks(@TenantId() tenantId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.flashcardsService.listDecks(tenantId, user.id);
  }

  @Get('decks/:deckId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get deck with all cards' })
  getDeck(@Param('deckId') deckId: string) {
    return this.flashcardsService.getDeck(deckId);
  }

  @Delete('decks/:deckId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deck (creator only)' })
  deleteDeck(@Param('deckId') deckId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.flashcardsService.deleteDeck(deckId, user.id);
  }

  @Get('decks/:deckId/due')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get cards due for review today (spaced repetition)' })
  getDueCards(@Param('deckId') deckId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.flashcardsService.getDueCards(deckId, user.id);
  }

  @Get('decks/:deckId/stats')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get study stats for a deck' })
  getStudyStats(@Param('deckId') deckId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.flashcardsService.getStudyStats(deckId, user.id);
  }

  @Post('cards/:cardId/review')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit SM-2 review for a card (rating 0–5)' })
  reviewCard(
    @Param('cardId') cardId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReviewCardBodyDto,
  ) {
    return this.flashcardsService.reviewCard(user.id, { cardId, rating: dto.rating });
  }
}
