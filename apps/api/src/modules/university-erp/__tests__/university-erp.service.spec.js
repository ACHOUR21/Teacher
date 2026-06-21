"use strict";

var _testing = require("@nestjs/testing");
var _client = require("@prisma/client");
var _prisma = require("../../database/prisma.service");
var _universityErp = require("../university-erp.service");
const mockPrisma = {
  university: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  faculty: {
    create: jest.fn()
  },
  academicProgram: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  enrollment: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  }
};
describe('UniversityErpService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_universityErp.UniversityErpService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }]
    }).compile();
    service = module.get(_universityErp.UniversityErpService);
    jest.clearAllMocks();
  });
  describe('createUniversity', () => {
    it('should create a university for a tenant', async () => {
      const uni = {
        id: 'uni-1',
        tenantId: 'tenant-1',
        name: 'State University'
      };
      mockPrisma.university.create.mockResolvedValueOnce(uni);
      const result = await service.createUniversity('tenant-1', {
        name: 'State University'
      });
      expect(result.name).toBe('State University');
    });
  });
  describe('getUniversities', () => {
    it('should return active universities with faculty and program counts', async () => {
      const unis = [{
        id: 'uni-1',
        name: 'State Uni',
        isActive: true,
        _count: {
          faculties: 8,
          programs: 25
        }
      }];
      mockPrisma.university.findMany.mockResolvedValueOnce(unis);
      const result = await service.getUniversities('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]._count.programs).toBe(25);
    });
  });
  describe('createFaculty', () => {
    it('should create a faculty within a university', async () => {
      const faculty = {
        id: 'fac-1',
        universityId: 'uni-1',
        name: 'Engineering'
      };
      mockPrisma.faculty.create.mockResolvedValueOnce(faculty);
      const result = await service.createFaculty('uni-1', {
        name: 'Engineering',
        code: 'ENG'
      });
      expect(result.name).toBe('Engineering');
    });
  });
  describe('createProgram', () => {
    it('should create an academic program', async () => {
      const program = {
        id: 'prog-1',
        universityId: 'uni-1',
        name: 'Computer Science',
        degree: 'BSc',
        durationYears: 4
      };
      mockPrisma.academicProgram.create.mockResolvedValueOnce(program);
      const result = await service.createProgram('uni-1', {
        name: 'Computer Science',
        degree: 'BSc',
        durationYears: 4
      });
      expect(result.degree).toBe('BSc');
      expect(result.durationYears).toBe(4);
    });
  });
  describe('getPrograms', () => {
    it('should return programs with department and enrollment count', async () => {
      const programs = [{
        id: 'prog-1',
        name: 'CS',
        degree: 'BSc',
        department: {
          name: 'CS Dept'
        },
        _count: {
          enrollments: 120
        }
      }];
      mockPrisma.academicProgram.findMany.mockResolvedValueOnce(programs);
      const result = await service.getPrograms('uni-1');
      expect(result[0]._count.enrollments).toBe(120);
    });
  });
  describe('enrollStudent', () => {
    it('should enroll a student in a program', async () => {
      const enrollment = {
        id: 'enr-1',
        studentId: 's-1',
        programId: 'prog-1',
        status: _client.EnrollmentStatus.ACTIVE
      };
      mockPrisma.enrollment.create.mockResolvedValueOnce(enrollment);
      const result = await service.enrollStudent('s-1', 'prog-1');
      expect(result.status).toBe(_client.EnrollmentStatus.ACTIVE);
    });
  });
  describe('updateEnrollmentStatus', () => {
    it('should update enrollment status to COMPLETED with completedAt', async () => {
      const updated = {
        id: 'enr-1',
        status: _client.EnrollmentStatus.COMPLETED,
        completedAt: new Date()
      };
      mockPrisma.enrollment.update.mockResolvedValueOnce(updated);
      const result = await service.updateEnrollmentStatus('enr-1', _client.EnrollmentStatus.COMPLETED);
      expect(result.status).toBe(_client.EnrollmentStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          completedAt: expect.any(Date)
        })
      }));
    });
    it('should update enrollment status to WITHDRAWN without completedAt', async () => {
      const updated = {
        id: 'enr-1',
        status: _client.EnrollmentStatus.WITHDRAWN
      };
      mockPrisma.enrollment.update.mockResolvedValueOnce(updated);
      const result = await service.updateEnrollmentStatus('enr-1', _client.EnrollmentStatus.WITHDRAWN);
      expect(result.status).toBe(_client.EnrollmentStatus.WITHDRAWN);
    });
  });
});