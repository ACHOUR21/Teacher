import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { RedisService } from '../../cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { WhiteLabelService } from '../white-label.service';

const mockPrisma = {
  whiteLabel: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('WhiteLabelService', () => {
  let service: WhiteLabelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhiteLabelService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockCache },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') } },
      ],
    }).compile();

    service = module.get<WhiteLabelService>(WhiteLabelService);
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return cached settings when available', async () => {
      const settings = { brandName: 'AcmeEdu', primaryColor: '#ff0000' };
      mockCache.get.mockResolvedValueOnce(JSON.stringify(settings));

      const result = await service.getSettings('tenant-1');

      expect(result).toEqual(settings);
      expect(mockPrisma.whiteLabel.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when cache miss', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      const settings = { tenantId: 'tenant-1', brandName: 'AcmeEdu', primaryColor: '#0000ff' };
      mockPrisma.whiteLabel.findUnique.mockResolvedValueOnce(settings);

      const result = await service.getSettings('tenant-1');

      expect(result.brandName).toBe('AcmeEdu');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return null when no settings exist', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.whiteLabel.findUnique.mockResolvedValueOnce(null);

      const result = await service.getSettings('tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('upsertSettings', () => {
    it('should upsert settings and invalidate cache', async () => {
      const result = { tenantId: 'tenant-1', brandName: 'NewBrand', primaryColor: '#123456' };
      mockPrisma.whiteLabel.upsert.mockResolvedValueOnce(result);

      const updated = await service.upsertSettings('tenant-1', {
        brandName: 'NewBrand',
        primaryColor: '#123456',
      });

      expect(updated.brandName).toBe('NewBrand');
      expect(mockCache.del).toHaveBeenCalledWith('white-label:tenant-1');
    });
  });

  describe('getByDomain', () => {
    it('should return white-label config for a domain', async () => {
      const wl = { domain: 'school.example.com', tenant: { id: 't-1', name: 'School', slug: 'school', plan: 'PRO' } };
      mockPrisma.whiteLabel.findFirst.mockResolvedValueOnce(wl);

      const result = await service.getByDomain('school.example.com');

      expect(result?.domain).toBe('school.example.com');
    });
  });

  describe('generateThemeCSS', () => {
    it('should generate CSS with primary and secondary colors', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.whiteLabel.findUnique.mockResolvedValueOnce({
        primaryColor: '#1a73e8',
        secondaryColor: '#34a853',
        customCss: '.logo { width: 120px; }',
      });

      const css = await service.generateThemeCSS('tenant-1');

      expect(css).toContain('--color-primary: #1a73e8');
      expect(css).toContain('--color-secondary: #34a853');
      expect(css).toContain('.logo { width: 120px; }');
    });

    it('should return default CSS when no settings found', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.whiteLabel.findUnique.mockResolvedValueOnce(null);

      const css = await service.generateThemeCSS('tenant-1');

      expect(css).toContain('--color-primary: #6366f1');
      expect(css).toContain('--color-secondary: #8b5cf6');
    });
  });
});
