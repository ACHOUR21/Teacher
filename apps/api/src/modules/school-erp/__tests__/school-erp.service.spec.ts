import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SchoolErpService } from '../school-erp.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  school: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  department: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  schoolClass: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  timetable: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  student: { count: jest.fn() },
  teacher: { count: jest.fn() },
  liveSession: { count: jest.fn() },
};

describe('SchoolErpService', () => {
  let service: SchoolErpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolErpService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SchoolErpService>(SchoolErpService);
    jest.clearAllMocks();
  });

  describe('createSchool', () => {
    it('should create a school for a tenant', async () => {
      const school = { id: 'sch-1', tenantId: 'tenant-1', name: 'Main Campus' };
      mockPrisma.school.create.mockResolvedValueOnce(school);

      const result = await service.createSchool('tenant-1', { name: 'Main Campus' });

      expect(result.name).toBe('Main Campus');
    });
  });

  describe('getSchools', () => {
    it('should return active schools with counts', async () => {
      const schools = [
        { id: 'sch-1', name: 'Main Campus', _count: { departments: 5, classes: 20, teachers: 30, students: 300 } },
      ];
      mockPrisma.school.findMany.mockResolvedValueOnce(schools);

      const result = await service.getSchools('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]._count.students).toBe(300);
    });
  });

  describe('getSchool', () => {
    it('should return school with departments and classes', async () => {
      const school = {
        id: 'sch-1',
        name: 'Main Campus',
        departments: [{ id: 'd-1', name: 'Science', _count: { classes: 3 } }],
        classes: [{ id: 'cls-1', name: '10A', _count: { students: 32 } }],
        _count: { teachers: 15, students: 200 },
      };
      mockPrisma.school.findUnique.mockResolvedValueOnce(school);

      const result = await service.getSchool('sch-1');

      expect(result.departments).toHaveLength(1);
      expect(result.classes).toHaveLength(1);
    });

    it('should throw NotFoundException for unknown school', async () => {
      mockPrisma.school.findUnique.mockResolvedValueOnce(null);

      await expect(service.getSchool('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createDepartment', () => {
    it('should create a department for a school', async () => {
      const dept = { id: 'd-1', schoolId: 'sch-1', name: 'Mathematics' };
      mockPrisma.department.create.mockResolvedValueOnce(dept);

      const result = await service.createDepartment('sch-1', { name: 'Mathematics' });

      expect(result.name).toBe('Mathematics');
    });
  });

  describe('createClass', () => {
    it('should create a school class', async () => {
      const cls = { id: 'cls-1', schoolId: 'sch-1', name: '10A', grade: '10', academicYear: '2025' };
      mockPrisma.schoolClass.create.mockResolvedValueOnce(cls);

      const result = await service.createClass('sch-1', { name: '10A', grade: '10', academicYear: '2025' });

      expect(result.grade).toBe('10');
    });
  });

  describe('getTimetable', () => {
    it('should return timetable ordered by day and time', async () => {
      const entries = [
        { id: 't-1', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' },
        { id: 't-2', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
      ];
      mockPrisma.timetable.findMany.mockResolvedValueOnce(entries);

      const result = await service.getTimetable('cls-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('getSchoolStats', () => {
    it('should return aggregated school statistics', async () => {
      mockPrisma.student.count.mockResolvedValueOnce(300);
      mockPrisma.teacher.count.mockResolvedValueOnce(25);
      mockPrisma.schoolClass.count.mockResolvedValueOnce(15);
      mockPrisma.liveSession.count.mockResolvedValueOnce(2);

      const result = await service.getSchoolStats('sch-1');

      expect(result.totalStudents).toBe(300);
      expect(result.totalTeachers).toBe(25);
      expect(result.totalClasses).toBe(15);
      expect(result.activeSessions).toBe(2);
    });
  });
});
