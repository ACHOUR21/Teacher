"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StorageService = void 0;
var _fs = require("fs");
var _path = require("path");
var _crypto = require("crypto");
var _clientS = require("@aws-sdk/client-s3");
var _s3RequestPresigner = require("@aws-sdk/s3-request-presigner");
var _common = require("@nestjs/common");
var _resilience = require("../core/services/resilience.service");
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
var StorageService_1;
let StorageService = exports.StorageService = StorageService_1 = class StorageService {
  logger = new _common.Logger(StorageService_1.name);
  provider;
  uploadDir;
  // S3-specific (only initialised when provider === 's3')
  s3 = null;
  bucket;
  endpoint;
  constructor(resilience) {
    this.resilience = resilience;
    this.provider = process.env['STORAGE_PROVIDER'] ?? 'local';
    this.uploadDir = process.env['UPLOAD_DIR'] ?? (0, _path.join)(process.cwd(), 'uploads');
    this.bucket = process.env['S3_BUCKET'] ?? 'eduai';
    this.endpoint = process.env['S3_ENDPOINT'] ?? 'http://localhost:9000';
    if (this.provider === 's3') {
      this.s3 = new _clientS.S3Client({
        endpoint: this.endpoint,
        region: process.env['S3_REGION'] ?? 'us-east-1',
        credentials: {
          accessKeyId: process.env['S3_ACCESS_KEY'] ?? 'minioadmin',
          secretAccessKey: process.env['S3_SECRET_KEY'] ?? 'minioadmin'
        },
        forcePathStyle: true
      });
      this.logger.log('StorageService: using S3/MinIO storage');
    } else {
      // Ensure local upload directory exists
      if (!(0, _fs.existsSync)(this.uploadDir)) {
        (0, _fs.mkdirSync)(this.uploadDir, {
          recursive: true
        });
      }
      this.logger.log(`StorageService: using local disk storage at ${this.uploadDir}`);
    }
  }
  getProvider() {
    return this.provider;
  }
  getLocalUrl(filename) {
    const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
    return `${baseUrl}/uploads/${filename}`;
  }
  getKey(folder, originalname) {
    const ext = (0, _path.extname)(originalname).toLowerCase();
    return `${folder}/${(0, _crypto.randomUUID)()}${ext}`;
  }
  /**
   * Upload a file. Supports both memory-buffered (S3) and disk-stored (local) multer files.
   * For local provider, `file.path` (set by diskStorage) is used; for S3, `file.buffer` is used.
   */
  async upload(file, folder = 'uploads') {
    if (this.provider === 'local') {
      return this.uploadLocal(file, folder);
    }
    return this.uploadS3(file, folder);
  }
  async uploadLocal(file, folder) {
    // When using diskStorage, multer writes the file and sets file.filename + file.path
    // When using memoryStorage (fallback), we write manually
    if (file.path && file.filename) {
      // Already on disk thanks to diskStorage — just build the URL
      const url = this.getLocalUrl(file.filename);
      return {
        key: file.filename,
        url
      };
    }
    // Fallback: write buffer to disk manually
    const {
      writeFile
    } = await import('fs/promises');
    const ext = (0, _path.extname)(file.originalname).toLowerCase() || '.bin';
    const filename = `${Date.now()}-${(0, _crypto.randomUUID)()}${ext}`;
    const destPath = (0, _path.join)(this.uploadDir, filename);
    await writeFile(destPath, file.buffer);
    const url = this.getLocalUrl(filename);
    return {
      key: filename,
      url
    };
  }
  async uploadS3(file, folder) {
    const key = this.getKey(folder, file.originalname);
    await this.resilience.withResilience('s3-upload', () => this.s3.send(new _clientS.PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size
    })), () => {
      throw new _common.ServiceUnavailableException('File upload service is temporarily unavailable. Please try again shortly.');
    }, {
      maxAttempts: 3,
      baseDelayMs: 500
    });
    const url = `${this.endpoint}/${this.bucket}/${key}`;
    return {
      key,
      url
    };
  }
  async delete(key) {
    if (this.provider === 'local') {
      const {
        unlink
      } = await import('fs/promises');
      const filePath = (0, _path.join)(this.uploadDir, key);
      try {
        await unlink(filePath);
      } catch {
        this.logger.warn(`Local delete: file not found at ${filePath}`);
      }
      return;
    }
    await this.resilience.withResilience('s3-delete', () => this.s3.send(new _clientS.DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    })), undefined, {
      maxAttempts: 3,
      baseDelayMs: 500
    });
  }
  async getSignedDownloadUrl(key, expiresIn = 3600) {
    if (this.provider === 'local') {
      // For local storage, just return the public URL (no signing needed)
      return this.getLocalUrl(key);
    }
    return this.resilience.withResilience('s3-download', () => (0, _s3RequestPresigner.getSignedUrl)(this.s3, new _clientS.GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    }), {
      expiresIn
    }), () => {
      throw new _common.NotFoundException(`File '${key}' is temporarily unavailable. Please try again shortly.`);
    }, {
      maxAttempts: 3,
      baseDelayMs: 500
    });
  }
  async getPresignedUploadUrl(filename, contentType, folder = 'uploads') {
    if (this.provider === 'local') {
      // For local storage, return a marker URL that tells the frontend to POST multipart instead
      const ext = (0, _path.extname)(filename).toLowerCase() || '.bin';
      const key = `${Date.now()}-${(0, _crypto.randomUUID)()}${ext}`;
      const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
      // uploadUrl points to our own upload endpoint; publicUrl is where it will be served
      return {
        uploadUrl: `${baseUrl}/api/v1/storage/upload-local?key=${encodeURIComponent(key)}&folder=${encodeURIComponent(folder)}`,
        key,
        publicUrl: this.getLocalUrl(key)
      };
    }
    const key = this.getKey(folder, filename);
    const uploadUrl = await this.resilience.withResilience('s3-upload', () => (0, _s3RequestPresigner.getSignedUrl)(this.s3, new _clientS.PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType
    }), {
      expiresIn: 3600
    }), () => {
      throw new _common.ServiceUnavailableException('File upload service is temporarily unavailable. Please try again shortly.');
    }, {
      maxAttempts: 3,
      baseDelayMs: 500
    });
    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
    return {
      uploadUrl,
      key,
      publicUrl
    };
  }
};
exports.StorageService = StorageService = StorageService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_resilience.ResilienceService)), __metadata("design:paramtypes", [Object])], StorageService);