"use strict";

var _common = require("@nestjs/common");
var _testing = require("@nestjs/testing");
var _client = require("@prisma/client");
var _redis = require("../../cache/redis.service");
var _prisma = require("../../database/prisma.service");
var _tenants = require("../tenants.service");
const mockPrisma = {
  tenant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  user: {
    count: jest.fn(),
    findFirst: jest.fn()
  },
  student: {
    count: jest.fn()
  },
  teacher: {
    count: jest.fn()
  },
  course: {
    count: jest.fn()
  },
  liveSession: {
    count: jest.fn()
  }
};
const mockRedis = {
  getObject: jest.fn(),
  setObject: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn()
};
describe('TenantsService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_tenants.TenantsService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }, {
        provide: _redis.RedisService,
        useValue: mockRedis
      }]
    }).compile();
    service = module.get(_tenants.TenantsService);
    jest.clearAllMocks();
  });
  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([{
        id: 't-1',
        name: 'School A',
        slug: 'school-a',
        _count: {
          users: 50
        },
        subscription: {
          plan: 'PROFESSIONAL'
        }
      }]);
      mockPrisma.tenant.count.mockResolvedValueOnce(1);
      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
  describe('findById', () => {
    it('should return cached tenant when available', async () => {
      const cached = {
        id: 't-1',
        name: 'School A'
      };
      mockRedis.getObject.mockResolvedValueOnce(cached);
      const result = await service.findById('t-1');
      expect(result).toEqual(cached);
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });
    it('should throw NotFoundException for unknown tenant', async () => {
      mockRedis.getObject.mockResolvedValueOnce(null);
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);
      await expect(service.findById('bad-id')).rejects.toThrow(_common.NotFoundException);
    });
  });
  describe('create', () => {
    it('should create a tenant successfully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null); // slug not taken
      const tenant = {
        id: 't-1',
        name: 'New School',
        slug: 'new-school',
        type: _client.TenantType.SCHOOL
      };
      mockPrisma.tenant.create.mockResolvedValueOnce(tenant);
      const result = await service.create({
        name: 'New School',
        slug: 'new-school',
        type: _client.TenantType.SCHOOL
      });
      expect(result.slug).toBe('new-school');
    });
    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'existing'
      });
      await expect(service.create({
        name: 'Dup School',
        slug: 'existing-slug',
        type: _client.TenantType.SCHOOL
      })).rejects.toThrow(_common.ConflictException);
    });
    it('should throw ConflictException for duplicate domain', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null) // slug check
      .mockResolvedValueOnce({
        id: 'other'
      }); // domain check
      await expect(service.create({
        name: 'School',
        slug: 'new-slug',
        type: _client.TenantType.SCHOOL,
        domain: 'taken.com'
      })).rejects.toThrow(_common.ConflictException);
    });
  });
  describe('delete', () => {
    it('should delete tenant when requester is SUPER_ADMIN', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 't-1'
      });
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: 'admin-1',
        role: _client.UserRole.SUPER_ADMIN
      });
      mockPrisma.tenant.delete.mockResolvedValueOnce({});
      await service.delete('t-1', 'admin-1');
      expect(mockPrisma.tenant.delete).toHaveBeenCalledWith({
        where: {
          id: 't-1'
        }
      });
    });
    it('should throw ForbiddenException for non-SUPER_ADMIN', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 't-1'
      });
      mockPrisma.user.findFirst.mockResolvedValueOnce(null); // not SUPER_ADMIN
      await expect(service.delete('t-1', 'regular-user')).rejects.toThrow(_common.ForbiddenException);
    });
  });
  describe('getStats', () => {
    it('should return aggregated tenant counts', async () => {
      mockRedis.getObject.mockResolvedValueOnce(null);
      mockPrisma.user.count.mockResolvedValueOnce(200);
      mockPrisma.student.count.mockResolvedValueOnce(150);
      mockPrisma.teacher.count.mockResolvedValueOnce(20);
      mockPrisma.course.count.mockResolvedValueOnce(40);
      mockPrisma.liveSession.count.mockResolvedValueOnce(3);
      const result = await service.getStats('tenant-1');
      expect(result.users).toBe(200);
      expect(result.students).toBe(150);
      expect(result.teachers).toBe(20);
    });
  });
});