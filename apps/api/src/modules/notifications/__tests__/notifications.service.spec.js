"use strict";

var _testing = require("@nestjs/testing");
var _prisma = require("../../database/prisma.service");
var _notifications = require("../notifications.service");
const mockPrisma = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
};
describe('NotificationsService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_notifications.NotificationsService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }]
    }).compile();
    service = module.get(_notifications.NotificationsService);
    jest.clearAllMocks();
  });
  describe('createInApp', () => {
    it('should create an in-app notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'IN_APP',
        title: 'Enrolled in Mathematics 101',
        body: 'You have successfully enrolled in the course.',
        createdAt: new Date(),
        isRead: false
      };
      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);
      const result = await service.createInApp('user-1', 'IN_APP', 'Enrolled in Mathematics 101', 'You have successfully enrolled in the course.');
      expect(result.id).toBe('notif-1');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1'
        })
      }));
    });
  });
  describe('getUserNotifications', () => {
    it('should return paginated notifications for a user', async () => {
      const mockNotifs = [{
        id: 'n-1',
        type: 'IN_APP',
        title: 'Test',
        isRead: false,
        createdAt: new Date()
      }, {
        id: 'n-2',
        type: 'IN_APP',
        title: 'Assignment',
        isRead: true,
        createdAt: new Date()
      }];
      mockPrisma.notification.findMany.mockResolvedValueOnce(mockNotifs);
      mockPrisma.notification.count.mockResolvedValueOnce(2);
      const result = await service.getUserNotifications('user-1', 1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
  describe('markRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({
        count: 1
      });
      await service.markRead('user-1', 'n-1');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          id: 'n-1',
          userId: 'user-1'
        }),
        data: expect.objectContaining({
          isRead: true
        })
      }));
    });
  });
  describe('markAllRead', () => {
    it('should mark all unread notifications for user as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({
        count: 5
      });
      await service.markAllRead('user-1');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          isRead: false
        }),
        data: expect.objectContaining({
          isRead: true
        })
      }));
    });
  });
  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValueOnce(3);
      const count = await service.getUnreadCount('user-1');
      expect(count).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          isRead: false
        })
      }));
    });
  });
});