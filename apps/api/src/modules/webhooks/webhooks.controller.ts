import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, type CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';

import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('endpoints')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  registerEndpoint(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { url: string; events: string[]; secret?: string },
  ) {
    return this.webhooksService.registerEndpoint(user.tenantId, dto);
  }

  @Get('endpoints')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  listEndpoints(@CurrentUser() user: CurrentUserPayload) {
    return this.webhooksService.listEndpoints(user.tenantId);
  }

  @Delete('endpoints/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEndpoint(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.webhooksService.deleteEndpoint(user.tenantId, id);
  }

  @Post('test/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  testEndpoint(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.webhooksService.testEndpoint(user.tenantId, id);
  }
}
