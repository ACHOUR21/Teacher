import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';

import { Public } from '../../core/decorators/public.decorator';

import { EmailService } from './email.service';

/**
 * Development-only controller for previewing HTML email templates.
 * All routes are guarded with a NODE_ENV check — returning 404 in production.
 */
@ApiExcludeController()
@Controller('dev/email-preview')
export class EmailPreviewController {
  constructor(private readonly emailService: EmailService) {}

  @Public()
  @Get(':template')
  preview(@Param('template') template: string, @Res() res: Response): void {
    if (process.env['NODE_ENV'] === 'production') {
      throw new NotFoundException('Not found');
    }

    const html = this.emailService.previewTemplate(template);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
