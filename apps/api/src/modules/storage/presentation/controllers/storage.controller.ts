import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import {
  Controller, Post, Get, Body, UploadedFile, UseInterceptors, UseGuards,
  Query, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
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

  /** Returns current storage provider so the frontend can adapt its upload strategy. */
  @Get('config')
  @ApiOperation({ summary: 'Get storage configuration (provider type)' })
  getConfig() {
    return { provider: this.storageService.getProvider() };
  }

  /**
   * Upload a file directly as multipart/form-data.
   * Works for both local disk and S3 providers.
   * For S3, the file is buffered and forwarded. For local, it's written to disk by multer.
   */
  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'uploads' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    if (!file) { throw new BadRequestException('No file provided'); }
    return this.storageService.upload(file, folder ?? 'uploads');
  }

  /**
   * Alias endpoints for semantic clarity (avatars, thumbnails, documents, videos).
   * All accept multipart/form-data with a 'file' field.
   */
  @Post('upload/avatar')
  @ApiOperation({ summary: 'Upload a user avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) { throw new BadRequestException('No file provided'); }
    return this.storageService.upload(file, 'avatars');
  }

  @Post('upload/thumbnail')
  @ApiOperation({ summary: 'Upload a course thumbnail image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) { throw new BadRequestException('No file provided'); }
    return this.storageService.upload(file, 'thumbnails');
  }

  @Post('upload/document')
  @ApiOperation({ summary: 'Upload a document (PDF, DOCX, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) { throw new BadRequestException('No file provided'); }
    return this.storageService.upload(file, 'documents');
  }

  @Post('upload/video')
  @ApiOperation({ summary: 'Upload a lesson video (up to 2 GB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB override for video
      storage: ((): ReturnType<typeof diskStorage> | undefined => {
        const isLocal = (process.env['STORAGE_PROVIDER'] ?? 'local') === 'local';
        if (!isLocal) { return undefined; }
        const uploadDir = process.env['UPLOAD_DIR'] ?? join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) { mkdirSync(uploadDir, { recursive: true }); }
        return diskStorage({
          destination: uploadDir,
          filename: (_req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
          },
        });
      })(),
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) { throw new BadRequestException('No file provided'); }
    return this.storageService.upload(file, 'videos');
  }

  /**
   * Local-storage only: receives a binary PUT body and saves it under a pre-determined key.
   * This endpoint is the target of uploadUrl returned by getPresignedUploadUrl() in local mode.
   * The frontend ImageUpload/VideoUpload components PUT directly to this URL.
   */
  @Post('upload-local')
  @ApiOperation({ summary: 'Local-storage: receive raw file body (used by presigned-url flow in local mode)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadLocal(
    @UploadedFile() file: Express.Multer.File,
    @Query('key') key: string,
    @Query('folder') folder: string,
  ) {
    if (!file) { throw new BadRequestException('No file provided'); }
    // Ignore key/folder query params for now — let multer handle naming via diskStorage
    return this.storageService.upload(file, folder ?? 'uploads');
  }

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for direct browser upload (S3) or local upload proxy URL' })
  getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.storageService.getPresignedUploadUrl(dto.filename, dto.contentType, dto.folder);
  }
}
