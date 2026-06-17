import { IsHexColor, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBrandingDto {
  @ApiPropertyOptional({ example: 'https://cdn.eduai.example.com/tenants/t-1/logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.eduai.example.com/tenants/t-1/favicon' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#8b5cf6' })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#06b6d4' })
  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @ApiPropertyOptional({ example: 'Inter' })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'Empowering learners everywhere' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: '.logo { width: 120px; }' })
  @IsOptional()
  @IsString()
  customCss?: string;
}
