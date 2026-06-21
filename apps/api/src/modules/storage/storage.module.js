"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StorageModule = void 0;
var _fs = require("fs");
var _path = require("path");
var _common = require("@nestjs/common");
var _platformExpress = require("@nestjs/platform-express");
var _multer = require("multer");
var _storage = require("./presentation/controllers/storage.controller");
var _storage2 = require("./storage.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const isLocal = (process.env['STORAGE_PROVIDER'] ?? 'local') === 'local';
const uploadDir = process.env['UPLOAD_DIR'] ?? (0, _path.join)(process.cwd(), 'uploads');
if (isLocal && !(0, _fs.existsSync)(uploadDir)) {
  (0, _fs.mkdirSync)(uploadDir, {
    recursive: true
  });
}
let StorageModule = exports.StorageModule = class StorageModule {};
exports.StorageModule = StorageModule = __decorate([(0, _common.Module)({
  imports: [_platformExpress.MulterModule.register({
    storage: isLocal ? (0, _multer.diskStorage)({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${(0, _path.extname)(file.originalname).toLowerCase()}`);
      }
    }) : (0, _multer.memoryStorage)(),
    limits: {
      fileSize: 50 * 1024 * 1024
    },
    // 50 MB default; video endpoints override per-interceptor
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(jpeg|jpg|png|gif|webp|pdf|mp4|mov|webm|avi|doc|docx|ppt|pptx|xls|xlsx|zip)$/i;
      if (allowed.test((0, _path.extname)(file.originalname))) {
        cb(null, true);
      } else {
        cb(new Error(`File type not allowed: ${(0, _path.extname)(file.originalname)}`), false);
      }
    }
  })],
  controllers: [_storage.StorageController],
  providers: [_storage2.StorageService],
  exports: [_storage2.StorageService, _platformExpress.MulterModule]
})], StorageModule);