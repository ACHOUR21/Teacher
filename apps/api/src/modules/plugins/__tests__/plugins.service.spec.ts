import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PluginsService } from '../plugins.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  plugin: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  installedPlugin: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PluginsService', () => {
  let service: PluginsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PluginsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PluginsService>(PluginsService);
    jest.clearAllMocks();
  });

  describe('listMarketplace', () => {
    it('should return paginated plugins ordered by installCount', async () => {
      const plugins = [
        { id: 'p-1', name: 'Quiz Builder', category: 'Assessment', installCount: 500 },
      ];
      mockPrisma.plugin.findMany.mockResolvedValueOnce(plugins);
      mockPrisma.plugin.count.mockResolvedValueOnce(1);

      const result = await service.listMarketplace('tenant-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      mockPrisma.plugin.findMany.mockResolvedValueOnce([]);
      mockPrisma.plugin.count.mockResolvedValueOnce(0);

      await service.listMarketplace('tenant-1', { search: 'quiz' });

      expect(mockPrisma.plugin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: expect.objectContaining({ contains: 'quiz' }) }),
        }),
      );
    });
  });

  describe('installPlugin', () => {
    it('should install a plugin and increment installCount', async () => {
      mockPrisma.plugin.findUnique.mockResolvedValueOnce({ id: 'p-1', name: 'Quiz Builder' });
      mockPrisma.installedPlugin.findUnique.mockResolvedValueOnce(null); // not yet installed
      const installed = { id: 'ip-1', tenantId: 'tenant-1', pluginId: 'p-1', plugin: { name: 'Quiz Builder' } };
      mockPrisma.$transaction.mockResolvedValueOnce([installed, {}]);

      const result = await service.installPlugin('tenant-1', 'p-1');

      expect(result.id).toBe('ip-1');
    });

    it('should throw NotFoundException for unknown plugin', async () => {
      mockPrisma.plugin.findUnique.mockResolvedValueOnce(null);

      await expect(service.installPlugin('tenant-1', 'bad-plugin')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when plugin already installed', async () => {
      mockPrisma.plugin.findUnique.mockResolvedValueOnce({ id: 'p-1' });
      mockPrisma.installedPlugin.findUnique.mockResolvedValueOnce({ id: 'ip-1' }); // already installed

      await expect(service.installPlugin('tenant-1', 'p-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall a plugin and decrement installCount', async () => {
      mockPrisma.installedPlugin.findUnique.mockResolvedValueOnce({ id: 'ip-1' });
      mockPrisma.$transaction.mockResolvedValueOnce([{}, {}]);

      const result = await service.uninstallPlugin('tenant-1', 'p-1');

      expect(result.message).toBe('Plugin uninstalled');
    });

    it('should throw NotFoundException when plugin not installed', async () => {
      mockPrisma.installedPlugin.findUnique.mockResolvedValueOnce(null);

      await expect(service.uninstallPlugin('tenant-1', 'p-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('togglePlugin', () => {
    it('should enable a plugin', async () => {
      mockPrisma.installedPlugin.findUnique.mockResolvedValueOnce({ id: 'ip-1', isEnabled: false });
      const updated = { id: 'ip-1', isEnabled: true, plugin: { name: 'Quiz Builder' } };
      mockPrisma.installedPlugin.update.mockResolvedValueOnce(updated);

      const result = await service.togglePlugin('tenant-1', 'p-1', true);

      expect(result.isEnabled).toBe(true);
    });

    it('should throw NotFoundException when plugin not installed', async () => {
      mockPrisma.installedPlugin.findUnique.mockResolvedValueOnce(null);

      await expect(service.togglePlugin('tenant-1', 'p-1', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPluginCategories', () => {
    it('should return distinct plugin categories', async () => {
      mockPrisma.plugin.findMany.mockResolvedValueOnce([
        { category: 'Assessment' },
        { category: 'Communication' },
        { category: null },
      ]);

      const result = await service.getPluginCategories();

      expect(result).toContain('Assessment');
      expect(result).toContain('Communication');
      expect(result).not.toContain(null);
    });
  });
});
