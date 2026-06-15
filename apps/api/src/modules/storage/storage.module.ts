import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { extname } from 'path';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';

import { StorageController } from './presentation/controllers/storage.controller';
import { StorageService } from './storage.service';

const isLocal = (process.env['STORAGE_PROVIDER'] ?? 'local') === 'local';
const uploadDir = process.env['UPLOAD_DIR'] ?? join(process.cwd(), 'uploads');

if (isLocal && !existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: isLocal
        ? diskStorage({
            destination: uploadDir,
            filename: (_req, file, cb) => {
              const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
              cb(null, `${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
            },
          })
        : memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB default; video endpoints override per-interceptor
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpeg|jpg|png|gif|webp|pdf|mp4|mov|webm|avi|doc|docx|ppt|pptx|xls|xlsx|zip)$/i;
        if (allowed.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(new Error(`File type not allowed: ${extname(file.originalname)}`), false);
        }
      },
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService, MulterModule],
})
export class StorageModule {}
