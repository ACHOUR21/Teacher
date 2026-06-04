import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CertificatesService } from '../../certificates.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

class IssueCertificateDto {
  @IsString() studentId: string;
  @IsString() templateId: string;
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
}
