/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { MessagingService } from '../../messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  getConversations(@CurrentUser() user: any) {
    return this.messagingService.getConversations(user.id);
  }

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Start or get direct conversation' })
  startDirect(@CurrentUser() user: any, @Body() body: { userId: string }) {
    return this.messagingService.createDirectConversation(user.id, body.userId);
  }

  @Post('conversations/group')
  @ApiOperation({ summary: 'Create a group conversation' })
  createGroup(@Body() body: { name: string; participantIds: string[] }) {
    return this.messagingService.createGroupConversation(body.name, body.participantIds);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.messagingService.getMessages(id, user.id, +page, +limit);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Body() body: { content: string; type?: string; attachments?: string[] },
  ) {
    return this.messagingService.sendMessage(conversationId, user.id, body.content, body.type, body.attachments);
  }
}
