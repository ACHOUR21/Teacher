/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '../../../core/decorators/public.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { WhiteLabelService } from '../../white-label.service';

@ApiTags('White Label')
@Controller('white-label')
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Get('settings')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get tenant white-label settings' })
  getSettings(@Request() req: any) {
    return this.whiteLabelService.getSettings(req.tenant?.id);
  }

  @Put('settings')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update white-label settings' })
  updateSettings(@Request() req: any, @Body() body: any) {
    return this.whiteLabelService.upsertSettings(req.tenant?.id, body);
  }

  @Get('theme.css')
  @Public()
  @ApiOperation({ summary: 'Get generated CSS theme for tenant' })
  async getThemeCSS(@Request() req: any) {
    const css = await this.whiteLabelService.generateThemeCSS(req.tenant?.id);
    return css;
  }

  @Get('by-domain/:domain')
  @Public()
  @ApiOperation({ summary: 'Resolve tenant by custom domain' })
  getByDomain(@Param('domain') domain: string) {
    return this.whiteLabelService.getByDomain(domain);
  }
}
