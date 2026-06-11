import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { TenantId } from '../core/decorators/tenant.decorator';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // ── COPPA ──────────────────────────────────────────────────────────────────

  @Get('coppa/status')
  @ApiOperation({ summary: 'Get COPPA compliance status for the current user' })
  @ApiResponse({ status: 200, description: 'COPPA status returned' })
  async getCoppaStatus(@CurrentUser('id') userId: string) {
    return this.complianceService.getCoppaStatus(userId);
  }

  @Post('coppa/consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant parental consent for a minor (COPPA)' })
  @ApiResponse({ status: 200, description: 'Parental consent recorded' })
  async grantParentalConsent(
    @Body()
    body: { minorUserId: string; parentEmail: string; token: string },
  ) {
    await this.complianceService.grantParentalConsent(
      body.minorUserId,
      body.parentEmail,
      body.token,
    );
    return { message: 'Parental consent granted successfully' };
  }

  // ── FERPA ──────────────────────────────────────────────────────────────────

  @Put('ferpa/directory-restriction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enable or disable FERPA directory restriction for the current user',
  })
  @ApiResponse({ status: 200, description: 'Directory restriction updated' })
  async setDirectoryRestriction(
    @CurrentUser('id') userId: string,
    @Body() body: { restricted: boolean },
  ) {
    await this.complianceService.setDirectoryRestriction(userId, body.restricted);
    return {
      message: `FERPA directory restriction ${body.restricted ? 'enabled' : 'disabled'}`,
    };
  }

  @Get('ferpa/audit')
  @ApiOperation({
    summary: 'List FERPA-sensitive student-record access entries from audit logs',
  })
  @ApiResponse({ status: 200, description: 'FERPA audit log entries' })
  async getFerpaAudit(
    @TenantId() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.complianceService.getFerpaAuditLog(
      tenantId,
      isNaN(parsedLimit) ? 50 : parsedLimit,
    );
  }
}
