import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CertificatesService } from '../certificates.service';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';

const mockPrisma = {
  certificateTemplate: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  issuedCertificate: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockStorage = {
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/certs/test.pdf', key: 'certs/test.pdf' }),
};

jest.mock('pdfkit', () => {
  const mockDoc: any = {
    pipe: jest.fn().mockReturnThis(),
    end: jest.fn(),
    on: jest.fn((event: string, cb: Function) => { if (event === 'end') cb(); return mockDoc; }),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    linearGradient: jest.fn().mockReturnValue({ stop: jest.fn().mockReturnThis() }),
    page: { width: 841.89, height: 595.28 },
  };
  const PDFDocumentMock = jest.fn().mockImplementation(() => mockDoc);
  return { __esModule: true, default: PDFDocumentMock };
});

describe('CertificatesService', () => {
  let service: CertificatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    jest.clearAllMocks();
  });

  describe('issueCertificate', () => {
    it('should issue a certificate for a completed enrollment', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        name: 'Course Completion',
        tenantId: 'tenant-1',
        isActive: true,
      };
      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const mockEnrollment = {
        id: 'enroll-1',
        userId: 'user-1',
        courseId: 'course-1',
        course: { title: 'Mathematics 101', tenantId: 'tenant-1' },
        completedAt: new Date(),
      };
      const mockIssuedCert = {
        id: 'cert-1',
        userId: 'user-1',
        templateId: 'tmpl-1',
        credentialId: 'CERT-XXXX',
        pdfUrl: 'https://cdn.example.com/certs/test.pdf',
        issuedAt: new Date(),
      };

      mockPrisma.certificateTemplate.findFirst.mockResolvedValueOnce(mockTemplate);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.enrollment.findFirst.mockResolvedValueOnce(mockEnrollment);
      mockPrisma.issuedCertificate.findFirst.mockResolvedValueOnce(null);
      mockPrisma.issuedCertificate.create.mockResolvedValueOnce(mockIssuedCert);

      const result = await service.issueCertificate({
        tenantId: 'tenant-1',
        userId: 'user-1',
        courseId: 'course-1',
      });

      expect(result.credentialId).toBeDefined();
      expect(result.pdfUrl).toContain('cdn.example.com');
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrisma.certificateTemplate.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.issueCertificate({ tenantId: 'tenant-1', userId: 'user-1', courseId: 'course-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserCertificates', () => {
    it('should return all certificates for a user', async () => {
      const mockCerts = [
        { id: 'c-1', credentialId: 'CERT-001', issuedAt: new Date(), template: { name: 'Math Cert' } },
        { id: 'c-2', credentialId: 'CERT-002', issuedAt: new Date(), template: { name: 'Science Cert' } },
      ];
      mockPrisma.issuedCertificate.findMany.mockResolvedValueOnce(mockCerts);
      mockPrisma.issuedCertificate.count.mockResolvedValueOnce(2);

      const result = await service.getUserCertificates('user-1', { page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
