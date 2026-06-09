import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { StorageService } from '../../storage.service';

class PresignedUrlDto {
  @IsString() filename: string;
  @IsString() contentType: string;
  @IsOptional() @IsString() folder?: string;
}

@ApiTags('Storage')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder: string) {
    return this.storageService.upload(file, folder);
  }

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for direct browser upload' })
  getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.storageService.getPresignedUploadUrl(dto.filename, dto.contentType, dto.folder);
  }
}
