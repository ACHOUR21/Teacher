import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsInt, Min } from 'class-validator';
import { ApiEcosystemService } from '../../api-ecosystem.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../core/decorators/roles.decorator';

class CreateApiKeyDto {
  @IsString() name: string;
  @IsArray() @IsString({ each: true }) scopes: string[];
  @IsOptional() @IsInt() @Min(100) rateLimit?: number;
}

class CreateWebhookDto {
  @IsString() url: string;
  @IsArray() @IsString({ each: true }) events: string[];
}

@ApiTags('API Ecosystem')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api-ecosystem')
export class ApiEcosystemController {
  constructor(private readonly apiEcosystemService: ApiEcosystemService) {}

  @Get('keys')
  @ApiOperation({ summary: 'List API keys' })
  listKeys(@Request() req: any) {
    return this.apiEcosystemService.listApiKeys(req.tenant?.id);
  }

  @Post('keys')
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create API key' })
  createKey(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    return this.apiEcosystemService.createApiKey(req.tenant?.id, dto.name, dto.scopes, dto.rateLimit);
  }

  @Delete('keys/:id')
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revoke API key' })
  revokeKey(@Param('id') id: string, @Request() req: any) {
    return this.apiEcosystemService.revokeApiKey(id, req.tenant?.id);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List webhook endpoints' })
  listWebhooks(@Request() req: any) {
    return this.apiEcosystemService.listWebhooks(req.tenant?.id);
  }

  @Post('webhooks')
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create webhook endpoint' })
  createWebhook(@Request() req: any, @Body() dto: CreateWebhookDto) {
    return this.apiEcosystemService.createWebhook(req.tenant?.id, dto.url, dto.events);
  }
}
