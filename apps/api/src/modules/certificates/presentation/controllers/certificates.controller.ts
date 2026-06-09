import {
  Controller, Get, Post, Param, Body, UseGuards, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth , ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Response } from 'express';

import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { Public } from '../../../core/decorators/public.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { CertificatesService } from '../../certificates.service';

class IssueCertificateDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty() @IsString() templateId: string;
}

class IssueToUserDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() templateId: string;
}

class IssueCertificateByTemplateDto {
  @ApiProperty() @IsString() templateId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string;
  @ApiProperty() @IsString() recipientId: string;
}

class CreateTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bodyText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() backgroundColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() textColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() borderStyle?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showSignature?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string;
}

@ApiTags('Certificates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ---- Templates -----------------------------------------------------------

  @Get('templates')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List certificate templates for this tenant' })
  getTemplates(@TenantId() tenantId: string) {
    return this.certificatesService.getTemplates(tenantId);
  }

  @Post('templates')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a certificate template' })
  createTemplate(@TenantId() tenantId: string, @Body() dto: CreateTemplateDto) {
    return this.certificatesService.createTemplate({ ...dto, tenantId });
  }

  // ---- Issuance ------------------------------------------------------------

  @Post('issue')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Issue a certificate to a student (by studentId)' })
  issue(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issueCertificate(dto.studentId, dto.templateId);
  }

  @Post('issue-to-user')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Issue a certificate to any user (by userId)' })
  issueToUser(@Body() dto: IssueToUserDto) {
    return this.certificatesService.issueToUser(dto.userId, dto.templateId);
  }

  @Post('issue-by-template')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Issue a certificate by template with course and recipient' })
  issueByTemplate(@Body() dto: IssueCertificateByTemplateDto) {
    return this.certificatesService.issueCertificateByTemplate(dto);
  }

  // ---- Listing -------------------------------------------------------------

  @Get('my')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get my certificates' })
  myCertificates(@CurrentUser() user: CurrentUserPayload) {
    return this.certificatesService.getUserCertificates(user.id);
  }

  @Get('tenant')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all certificates issued in this tenant (admin view)' })
  tenantCertificates(@TenantId() tenantId: string) {
    return this.certificatesService.getTenantCertificates(tenantId);
  }

  // ---- Verification (public) -----------------------------------------------

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Publicly verify a certificate by code' })
  verify(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }

  // ---- Download ------------------------------------------------------------

  @Get(':id/download')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
