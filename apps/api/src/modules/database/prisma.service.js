"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PrismaService = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
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
var PrismaService_1;
let PrismaService = exports.PrismaService = PrismaService_1 = class PrismaService extends _client.PrismaClient {
  logger = new _common.Logger(PrismaService_1.name);
  constructor() {
    super({
      log: [{
        emit: 'event',
        level: 'query'
      }, {
        emit: 'event',
        level: 'error'
      }, {
        emit: 'event',
        level: 'warn'
      }]
    });
    // Log slow queries
    this.$on('query', e => {
      if (e.duration > 500) {
        this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
  async cleanDatabase() {
    if (process.env['NODE_ENV'] !== 'test') {
      throw new Error('cleanDatabase can only be called in test environment');
    }
    const tablenames = await this.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    for (const {
      tablename
    } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
  }
};
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([(0, _common.Injectable)(), __metadata("design:paramtypes", [])], PrismaService);