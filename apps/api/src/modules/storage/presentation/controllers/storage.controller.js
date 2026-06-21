"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StorageController = void 0;
var _path = require("path");
var _fs = require("fs");
var _common = require("@nestjs/common");
var _platformExpress = require("@nestjs/platform-express");
var _swagger = require("@nestjs/swagger");
var _multer = require("multer");
var _classValidator = require("class-validator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _storage = require("../../storage.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
class PresignedUrlDto {
  filename;
  contentType;
  folder;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], PresignedUrlDto.prototype, "filename", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], PresignedUrlDto.prototype, "contentType", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], PresignedUrlDto.prototype, "folder", void 0);
let StorageController = exports.StorageController = class StorageController {
  constructor(storageService) {
    this.storageService = storageService;
  }
  /** Returns current storage provider so the frontend can adapt its upload strategy. */
  getConfig() {
    return {
      provider: this.storageService.getProvider()
    };
  }
  /**
   * Upload a file directly as multipart/form-data.
   * Works for both local disk and S3 providers.
   * For S3, the file is buffered and forwarded. For local, it's written to disk by multer.
   */
  async upload(file, folder) {
    if (!file) {
      throw new _common.BadRequestException('No file provided');
    }
    return this.storageService.upload(file, folder ?? 'uploads');
  }
  /**
   * Alias endpoints for semantic clarity (avatars, thumbnails, documents, videos).
   * All accept multipart/form-data with a 'file' field.
   */
  async uploadAvatar(file) {
    if (!file) {
      throw new _common.BadRequestException('No file provided');
    }
    return this.storageService.upload(file, 'avatars');
  }
  async uploadThumbnail(file) {
    if (!file) {
      throw new _common.BadRequestException('No file provided');
    }
    return this.storageService.upload(file, 'thumbnails');
  }
  async uploadDocument(file) {
    if (!file) {
      throw new _common.BadRequestException('No file provided');
    }
    return this.storageService.upload(file, 'documents');
  }
  async uploadVideo(file) {
    if (!file) {
      throw new _common.BadRequestException('No file provided');
    }
    return this.storageService.upload(file, 'videos');
  }
  /**
   * Local-storage only: receives a binary PUT body and saves it under a pre-determined key.
   * This endpoint is the target of uploadUrl returned by getPresignedUploadUrl() in local mode.
   * The frontend ImageUpload/VideoUpload components PUT directly to this URL.
   */
  async uploadLocal(file, key, folder) {
    if (!file) {
      throw new _common.BadRequestException('No file provided');
    }
    // Ignore key/folder query params for now — let multer handle naming via diskStorage
    return this.storageService.upload(file, folder ?? 'uploads');
  }
  getPresignedUrl(dto) {
    return this.storageService.getPresignedUploadUrl(dto.filename, dto.contentType, dto.folder);
  }
};
__decorate([(0, _common.Get)('config'), (0, _swagger.ApiOperation)({
  summary: 'Get storage configuration (provider type)'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], StorageController.prototype, "getConfig", null);
__decorate([(0, _common.Post)('upload'), (0, _swagger.ApiOperation)({
  summary: 'Upload a file (multipart/form-data)'
}), (0, _swagger.ApiConsumes)('multipart/form-data'), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      },
      folder: {
        type: 'string',
        example: 'uploads'
      }
    }
  }
}), (0, _common.UseInterceptors)((0, _platformExpress.FileInterceptor)('file')), __param(0, (0, _common.UploadedFile)()), __param(1, (0, _common.Query)('folder')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, String]), __metadata("design:returntype", Promise)], StorageController.prototype, "upload", null);
__decorate([(0, _common.Post)('upload/avatar'), (0, _swagger.ApiOperation)({
  summary: 'Upload a user avatar image'
}), (0, _swagger.ApiConsumes)('multipart/form-data'), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
}), (0, _common.UseInterceptors)((0, _platformExpress.FileInterceptor)('file')), __param(0, (0, _common.UploadedFile)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_d = typeof Express !== "undefined" && (_c = Express.Multer) !== void 0 && _c.File) === "function" ? _d : Object]), __metadata("design:returntype", Promise)], StorageController.prototype, "uploadAvatar", null);
__decorate([(0, _common.Post)('upload/thumbnail'), (0, _swagger.ApiOperation)({
  summary: 'Upload a course thumbnail image'
}), (0, _swagger.ApiConsumes)('multipart/form-data'), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
}), (0, _common.UseInterceptors)((0, _platformExpress.FileInterceptor)('file')), __param(0, (0, _common.UploadedFile)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_f = typeof Express !== "undefined" && (_e = Express.Multer) !== void 0 && _e.File) === "function" ? _f : Object]), __metadata("design:returntype", Promise)], StorageController.prototype, "uploadThumbnail", null);
__decorate([(0, _common.Post)('upload/document'), (0, _swagger.ApiOperation)({
  summary: 'Upload a document (PDF, DOCX, etc.)'
}), (0, _swagger.ApiConsumes)('multipart/form-data'), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
}), (0, _common.UseInterceptors)((0, _platformExpress.FileInterceptor)('file')), __param(0, (0, _common.UploadedFile)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_h = typeof Express !== "undefined" && (_g = Express.Multer) !== void 0 && _g.File) === "function" ? _h : Object]), __metadata("design:returntype", Promise)], StorageController.prototype, "uploadDocument", null);
__decorate([(0, _common.Post)('upload/video'), (0, _swagger.ApiOperation)({
  summary: 'Upload a lesson video (up to 2 GB)'
}), (0, _swagger.ApiConsumes)('multipart/form-data'), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
}), (0, _common.UseInterceptors)((0, _platformExpress.FileInterceptor)('file', {
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  },
  // 2 GB override for video
  storage: (() => {
    const isLocal = (process.env['STORAGE_PROVIDER'] ?? 'local') === 'local';
    if (!isLocal) {
      return undefined;
    }
    const uploadDir = process.env['UPLOAD_DIR'] ?? (0, _path.join)(process.cwd(), 'uploads');
    if (!(0, _fs.existsSync)(uploadDir)) {
      (0, _fs.mkdirSync)(uploadDir, {
        recursive: true
      });
    }
    return (0, _multer.diskStorage)({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${(0, _path.extname)(file.originalname).toLowerCase()}`);
      }
    });
  })()
})), __param(0, (0, _common.UploadedFile)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_k = typeof Express !== "undefined" && (_j = Express.Multer) !== void 0 && _j.File) === "function" ? _k : Object]), __metadata("design:returntype", Promise)], StorageController.prototype, "uploadVideo", null);
__decorate([(0, _common.Post)('upload-local'), (0, _swagger.ApiOperation)({
  summary: 'Local-storage: receive raw file body (used by presigned-url flow in local mode)'
}), (0, _swagger.ApiConsumes)('multipart/form-data'), (0, _swagger.ApiBody)({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      }
    }
  }
}), (0, _common.UseInterceptors)((0, _platformExpress.FileInterceptor)('file')), __param(0, (0, _common.UploadedFile)()), __param(1, (0, _common.Query)('key')), __param(2, (0, _common.Query)('folder')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_m = typeof Express !== "undefined" && (_l = Express.Multer) !== void 0 && _l.File) === "function" ? _m : Object, String, String]), __metadata("design:returntype", Promise)], StorageController.prototype, "uploadLocal", null);
__decorate([(0, _common.Post)('presigned-url'), (0, _swagger.ApiOperation)({
  summary: 'Get presigned URL for direct browser upload (S3) or local upload proxy URL'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [PresignedUrlDto]), __metadata("design:returntype", void 0)], StorageController.prototype, "getPresignedUrl", null);
exports.StorageController = StorageController = __decorate([(0, _swagger.ApiTags)('Storage'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('storage'), __param(0, (0, _common.Inject)(_storage.StorageService)), __metadata("design:paramtypes", [Object])], StorageController);