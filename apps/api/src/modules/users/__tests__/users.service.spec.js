"use strict";

var _common = require("@nestjs/common");
var _testing = require("@nestjs/testing");
var _client = require("@prisma/client");
var _redis = require("../../cache/redis.service");
var _prisma = require("../../database/prisma.service");
var _users = require("../users.service");
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn()
  },
  userProfile: {
    upsert: jest.fn()
  },
  userSession: {
    findMany: jest.fn()
  },
  auditLog: {
    findMany: jest.fn()
  },
  courseProgress: {
    findMany: jest.fn()
  },
  userAchievement: {
    findMany: jest.fn()
  }
};
const mockRedis = {
  getObject: jest.fn(),
  setObject: jest.fn(),
  del: jest.fn()
};
describe('UsersService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_users.UsersService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }, {
        provide: _redis.RedisService,
        useValue: mockRedis
      }]
    }).compile();
    service = module.get(_users.UsersService);
    jest.clearAllMocks();
  });
  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([{
        id: 'u-1',
        email: 'alice@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: 'STUDENT',
        isActive: true
      }]);
      mockPrisma.user.count.mockResolvedValueOnce(1);
      const result = await service.findAll('tenant-1', {
        page: 1,
        limit: 20,
        skip: 0
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('should filter by role', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.count.mockResolvedValueOnce(0);
      await service.findAll('tenant-1', {
        page: 1,
        limit: 20,
        skip: 0
      }, _client.UserRole.TEACHER);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          role: _client.UserRole.TEACHER
        })
      }));
    });
  });
  describe('findById', () => {
    it('should return cached user when available', async () => {
      const cached = {
        id: 'u-1',
        email: 'alice@test.com'
      };
      mockRedis.getObject.mockResolvedValueOnce(cached);
      const result = await service.findById('u-1', 'tenant-1');
      expect(result).toEqual(cached);
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });
    it('should fetch user from DB and cache it', async () => {
      mockRedis.getObject.mockResolvedValueOnce(null);
      const user = {
        id: 'u-1',
        email: 'alice@test.com',
        firstName: 'Alice',
        role: 'STUDENT'
      };
      mockPrisma.user.findFirst.mockResolvedValueOnce(user);
      const result = await service.findById('u-1', 'tenant-1');
      expect(result).toEqual(user);
      expect(mockRedis.setObject).toHaveBeenCalled();
    });
    it('should throw NotFoundException for unknown user', async () => {
      mockRedis.getObject.mockResolvedValueOnce(null);
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      await expect(service.findById('bad-id', 'tenant-1')).rejects.toThrow(_common.NotFoundException);
    });
  });
  describe('update', () => {
    it('should update user fields and invalidate cache', async () => {
      const user = {
        id: 'u-1',
        tenantId: 'tenant-1'
      };
      const updated = {
        id: 'u-1',
        firstName: 'Bob'
      };
      mockPrisma.user.findFirst.mockResolvedValueOnce(user);
      mockPrisma.user.update.mockResolvedValueOnce(updated);
      const result = await service.update('u-1', 'tenant-1', {
        firstName: 'Bob'
      });
      expect(result.firstName).toBe('Bob');
      expect(mockRedis.del).toHaveBeenCalledWith('user:u-1:profile');
    });
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      await expect(service.update('bad-id', 'tenant-1', {
        firstName: 'Bob'
      })).rejects.toThrow(_common.NotFoundException);
    });
  });
  describe('delete', () => {
    it('should deactivate user when requester is SUPER_ADMIN', async () => {
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: 'u-1'
      });
      mockPrisma.user.update.mockResolvedValueOnce({});
      await service.delete('u-1', 'tenant-1', {
        id: 'admin-1',
        role: _client.UserRole.SUPER_ADMIN
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          isActive: false
        }
      }));
    });
    it('should throw ForbiddenException for non-admin deleting other user', async () => {
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: 'u-1'
      });
      await expect(service.delete('u-1', 'tenant-1', {
        id: 'other-user',
        role: _client.UserRole.STUDENT
      })).rejects.toThrow(_common.ForbiddenException);
    });
  });
  describe('assignRole', () => {
    it('should assign role when requester is ADMIN', async () => {
      const user = {
        id: 'u-1',
        tenantId: 'tenant-1'
      };
      const updated = {
        id: 'u-1',
        role: _client.UserRole.TEACHER
      };
      mockPrisma.user.findFirst.mockResolvedValueOnce(user);
      mockPrisma.user.update.mockResolvedValueOnce(updated);
      const result = await service.assignRole('u-1', 'tenant-1', _client.UserRole.TEACHER, {
        role: _client.UserRole.ADMIN
      });
      expect(result.role).toBe(_client.UserRole.TEACHER);
    });
    it('should throw ForbiddenException for non-admin', async () => {
      await expect(service.assignRole('u-1', 'tenant-1', _client.UserRole.TEACHER, {
        role: _client.UserRole.STUDENT
      })).rejects.toThrow(_common.ForbiddenException);
    });
  });
});