"use strict";

var _testing = require("@nestjs/testing");
var _client = require("@prisma/client");
var _prisma = require("../../database/prisma.service");
var _audit = require("../audit.service");
const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  }
};
describe('AuditService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_audit.AuditService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }]
    }).compile();
    service = module.get(_audit.AuditService);
    jest.clearAllMocks();
  });
  describe('log', () => {
    it('should create an audit log entry', async () => {
      const entry = {
        id: 'log-1',
        action: _client.AuditAction.CREATE,
        resource: 'course',
        createdAt: new Date()
      };
      mockPrisma.auditLog.create.mockResolvedValueOnce(entry);
      const result = await service.log({
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: _client.AuditAction.CREATE,
        resource: 'course',
        resourceId: 'c-1'
      });
      expect(result.action).toBe(_client.AuditAction.CREATE);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          action: _client.AuditAction.CREATE
        })
      }));
    });
    it('should persist before/after snapshots', async () => {
      const entry = {
        id: 'log-2'
      };
      mockPrisma.auditLog.create.mockResolvedValueOnce(entry);
      await service.log({
        tenantId: 'tenant-1',
        action: _client.AuditAction.UPDATE,
        resource: 'user',
        before: {
          name: 'Alice'
        },
        after: {
          name: 'Bob'
        }
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          before: {
            name: 'Alice'
          },
          after: {
            name: 'Bob'
          }
        })
      }));
    });
  });
  describe('query', () => {
    it('should return paginated audit logs for a tenant', async () => {
      const logs = [{
        id: 'log-1',
        action: _client.AuditAction.LOGIN,
        user: {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'a@test.com'
        }
      }];
      mockPrisma.auditLog.findMany.mockResolvedValueOnce(logs);
      mockPrisma.auditLog.count.mockResolvedValueOnce(1);
      const result = await service.query('tenant-1', {
        page: 1,
        limit: 50
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
    it('should filter by userId and action', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockPrisma.auditLog.count.mockResolvedValueOnce(0);
      await service.query('tenant-1', {
        userId: 'u-1',
        action: _client.AuditAction.DELETE
      });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u-1',
          action: _client.AuditAction.DELETE
        })
      }));
    });
    it('should apply date range filters', async () => {
      const from = new Date('2025-01-01');
      const to = new Date('2025-01-31');
      mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);
      mockPrisma.auditLog.count.mockResolvedValueOnce(0);
      await service.query('tenant-1', {
        from,
        to
      });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: from,
            lte: to
          }
        })
      }));
    });
  });
});