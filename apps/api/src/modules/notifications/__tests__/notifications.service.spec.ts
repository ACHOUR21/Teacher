import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../database/prisma.service';

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
  user: {
    findUnique: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
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
        isRead: false,
      };
      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);

      const result = await service.createInApp(
        'user-1',
        'IN_APP' as any,
        'Enrolled in Mathematics 101',
        'You have successfully enrolled in the course.',
      );

      expect(result.id).toBe('notif-1');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications for a user', async () => {
      const mockNotifs = [
        { id: 'n-1', type: 'IN_APP', title: 'Test', isRead: false, createdAt: new Date() },
        { id: 'n-2', type: 'IN_APP', title: 'Assignment', isRead: true, createdAt: new Date() },
      ];
      mockPrisma.notification.findMany.mockResolvedValueOnce(mockNotifs);
      mockPrisma.notification.count.mockResolvedValueOnce(2);

      const result = await service.getUserNotifications('user-1', 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.markRead('user-1', 'n-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'n-1', userId: 'user-1' }),
          data: expect.objectContaining({ isRead: true }),
        }),
      );
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications for user as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });

      const result = await service.markAllRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', isRead: false }),
          data: expect.objectContaining({ isRead: true }),
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
          where: expect.objectContaining({ userId: 'user-1', isRead: false }),
        }),
      );
    });
  });
});
