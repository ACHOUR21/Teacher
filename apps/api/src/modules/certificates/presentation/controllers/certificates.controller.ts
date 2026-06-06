import { Controller, Get, Post, Param, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Response } from 'express';
import { CertificatesService } from '../../certificates.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

class IssueCertificateDto {
  @IsString() studentId: string;
  @IsString() templateId: string;
}

class IssueCertificateByTemplateDto {
  @IsString() templateId: string;
  @IsOptional() @IsString() courseId?: string;
  @IsString() recipientId: string;
}

class CreateTemplateDto {
  @IsString() name: string;
  @IsString() title: string;
  @IsOptional() @IsString() bodyText?: string;
  @IsOptional() @IsString() backgroundColor?: string;
  @IsOptional() @IsString() textColor?: string;
  @IsOptional() @IsString() borderStyle?: string;
  @IsOptional() @IsBoolean() showSignature?: boolean;
  @IsOptional() @IsString() courseId?: string;
}

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('issue')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Issue a certificate to a student' })
  issue(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issueCertificate(dto.studentId, dto.templateId);
  }

  @Post('issue-by-template')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Issue a certificate by template with course and recipient' })
  issueByTemplate(@Body() dto: IssueCertificateByTemplateDto) {
    return this.certificatesService.issueCertificateByTemplate(dto);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Publicly verify a certificate by code' })
  verify(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }

  @Get('my')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user certificates' })
  myCertificates(@CurrentUser() user: any) {
    return this.certificatesService.getStudentCertificates(user.studentProfile?.id ?? user.id);
  }

  @Get('templates')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get certificate templates' })
  templates() {
    return this.certificatesService.getTemplates();
  }

  @Post('templates')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a certificate template' })
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.certificatesService.createTemplate(dto);
  }

  @Get(':id/download')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download a certificate as PDF' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.certificatesService.downloadCertificate(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
