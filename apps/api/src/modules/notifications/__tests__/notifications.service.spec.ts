import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';

const mockPrisma = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockRedis = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and publish to Redis', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'COURSE_ENROLLED',
        title: 'Enrolled in Mathematics 101',
        body: 'You have successfully enrolled in the course.',
        createdAt: new Date(),
        readAt: null,
      };
      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);

      const result = await service.createNotification({
        tenantId: 'tenant-1',
        userId: 'user-1',
        type: 'COURSE_ENROLLED',
        title: 'Enrolled in Mathematics 101',
        body: 'You have successfully enrolled in the course.',
      });

      expect(result.id).toBe('notif-1');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            type: 'COURSE_ENROLLED',
          }),
        }),
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications for a user', async () => {
      const mockNotifs = [
        { id: 'n-1', type: 'GENERAL', title: 'Test', readAt: null, createdAt: new Date() },
        { id: 'n-2', type: 'ASSIGNMENT_DUE', title: 'Assignment', readAt: new Date(), createdAt: new Date() },
      ];
      mockPrisma.notification.findMany.mockResolvedValueOnce(mockNotifs);
      mockPrisma.notification.count.mockResolvedValueOnce(2);

      const result = await service.getUserNotifications('user-1', { page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read with current timestamp', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce({
        id: 'n-1',
        userId: 'user-1',
        readAt: null,
      });
      mockPrisma.notification.update.mockResolvedValueOnce({
        id: 'n-1',
        readAt: new Date(),
      });

      const result = await service.markAsRead('user-1', 'n-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'n-1' },
          data: expect.objectContaining({ readAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications for user as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', readAt: null }),
          data: expect.objectContaining({ readAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValueOnce(3);

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', readAt: null }),
        }),
      );
    });
  });
});
