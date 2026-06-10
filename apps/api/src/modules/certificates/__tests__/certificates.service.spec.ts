import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CertificatesService } from '../certificates.service';


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
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockStorage = {
  upload: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/certs/test.pdf', key: 'certs/test.pdf' }),
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/certs/test.pdf', key: 'certs/test.pdf' }),
};

jest.mock('pdfkit', () => {
  const mockDoc: any = {
    pipe: jest.fn().mockReturnThis(),
    end: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/ban-types
    on: jest.fn((event: string, cb: Function) => {
      if (event === 'data') {cb(Buffer.from('mock-pdf'));}
      if (event === 'end') {cb();}
      return mockDoc;
    }),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    linearGradient: jest.fn().mockReturnValue({ stop: jest.fn().mockReturnThis() }),
    page: { width: 841.89, height: 595.28 },
  };
  // Service uses: const PDFDocument = require('pdfkit') — so module.exports must be the constructor
  const PDFDocumentMock = jest.fn().mockImplementation(() => mockDoc);
  return PDFDocumentMock;
});

describe('CertificatesService', () => {
  let service: CertificatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') },
        },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    jest.clearAllMocks();
  });

  describe('issueCertificate', () => {
    it('should issue a certificate for a student', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        name: 'Course Completion',
        course: { title: 'Mathematics 101' },
      };
      const mockStudent = {
        id: 'student-1',
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };
      const mockIssuedCert = {
        id: 'cert-1',
        studentId: 'student-1',
        templateId: 'tmpl-1',
        metadata: { pdfUrl: 'https://cdn.example.com/certs/test.pdf' },
        issuedAt: new Date(),
      };

      mockPrisma.certificateTemplate.findUnique.mockResolvedValueOnce(mockTemplate);
      mockPrisma.student.findUnique.mockResolvedValueOnce(mockStudent);
      mockPrisma.issuedCertificate.create.mockResolvedValueOnce(mockIssuedCert);
      mockPrisma.issuedCertificate.update.mockResolvedValueOnce(mockIssuedCert);

      const result = await service.issueCertificate('student-1', 'tmpl-1');

      expect(result.id).toBe('cert-1');
      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrisma.certificateTemplate.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.issueCertificate('student-1', 'bad-template'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudentCertificates', () => {
    it('should return all certificates for a student', async () => {
      const mockCerts = [
        { id: 'c-1', issuedAt: new Date(), template: { name: 'Math Cert', course: { title: 'Math', thumbnailUrl: null } } },
        { id: 'c-2', issuedAt: new Date(), template: { name: 'Science Cert', course: { title: 'Science', thumbnailUrl: null } } },
      ];
      mockPrisma.issuedCertificate.findMany.mockResolvedValueOnce(mockCerts);

      const result = await service.getStudentCertificates('student-1');

      expect(result).toHaveLength(2);
    });
  });
});
