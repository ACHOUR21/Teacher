import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AttendanceStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AttendanceService } from '../attendance.service';


const mockPrisma = {
  attendance: { upsert: jest.fn(), findMany: jest.fn() },
  student: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
  schoolClass: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // markAttendance
  // ---------------------------------------------------------------------------
  describe('markAttendance', () => {
    it('happy path: calls $transaction with one upsert promise per record', async () => {
      const upsertResult1 = { id: 'a1', studentId: 's1', status: AttendanceStatus.PRESENT };
      const upsertResult2 = { id: 'a2', studentId: 's2', status: AttendanceStatus.ABSENT };

      // upsert returns the promise that $transaction will receive
      mockPrisma.attendance.upsert
        .mockReturnValueOnce(upsertResult1)
        .mockReturnValueOnce(upsertResult2);

      mockPrisma.$transaction.mockResolvedValueOnce([upsertResult1, upsertResult2]);

      const records = [
        { studentId: 's1', status: AttendanceStatus.PRESENT, note: 'On time' },
        { studentId: 's2', status: AttendanceStatus.ABSENT, note: undefined },
      ];

      const result = await service.markAttendance('class1', '2024-03-15', records, 'teacher1');

      expect(mockPrisma.attendance.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      // $transaction receives the array of upsert return values (promises / objects)
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([upsertResult1, upsertResult2]);
      expect(result).toEqual([upsertResult1, upsertResult2]);
    });

    it('happy path: upsert is called with correct where / create / update shape', async () => {
      const upsertResult = { id: 'a1', studentId: 's1', status: AttendanceStatus.LATE };
      mockPrisma.attendance.upsert.mockReturnValueOnce(upsertResult);
      mockPrisma.$transaction.mockResolvedValueOnce([upsertResult]);

      await service.markAttendance(
        'class99',
        '2024-06-01',
        [{ studentId: 's1', status: AttendanceStatus.LATE, note: 'traffic' }],
        'teacher99',
      );

      const callArgs = mockPrisma.attendance.upsert.mock.calls[0][0];
      expect(callArgs.where.classId_studentId_date).toMatchObject({
        classId: 'class99',
        studentId: 's1',
        date: new Date('2024-06-01'),
      });
      expect(callArgs.update).toMatchObject({
        status: AttendanceStatus.LATE,
        note: 'traffic',
        markedById: 'teacher99',
      });
      expect(callArgs.create).toMatchObject({
        classId: 'class99',
        studentId: 's1',
        status: AttendanceStatus.LATE,
        markedById: 'teacher99',
      });
    });

    it('edge case: empty records array calls $transaction with empty array', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([]);

      const result = await service.markAttendance('class1', '2024-03-15', [], 'teacher1');

      expect(mockPrisma.attendance.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getClassAttendance
  // ---------------------------------------------------------------------------
  describe('getClassAttendance', () => {
    it('happy path: returns array from prisma.attendance.findMany', async () => {
      const mockRecords = [
        {
          id: 'a1',
          classId: 'class1',
          date: new Date('2024-03-15'),
          status: AttendanceStatus.PRESENT,
          student: { user: { firstName: 'Alice', lastName: 'Smith', avatarUrl: null } },
        },
      ];
      mockPrisma.attendance.findMany.mockResolvedValueOnce(mockRecords);

      const result = await service.getClassAttendance('class1', '2024-03-15');

      expect(result).toEqual(mockRecords);
      expect(mockPrisma.attendance.findMany).toHaveBeenCalledTimes(1);
    });

    it('filters by date: date string is parsed to a Date object in the where clause', async () => {
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getClassAttendance('class1', '2024-05-20');

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({
        classId: 'class1',
        date: new Date('2024-05-20'),
      });
    });

    it('includes student.user and orders by student.user.firstName asc', async () => {
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getClassAttendance('class1', '2024-05-20');

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.include.student.include.user.select).toMatchObject({
        firstName: true,
        lastName: true,
        avatarUrl: true,
      });
      expect(callArgs.orderBy).toEqual({ student: { user: { firstName: 'asc' } } });
    });
  });

  // ---------------------------------------------------------------------------
  // getStudentAttendance
  // ---------------------------------------------------------------------------
  describe('getStudentAttendance', () => {
    it('happy path: returns attendance records when student exists', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's1', name: 'Alice' });
      const mockAttendance = [{ id: 'a1', studentId: 's1', status: AttendanceStatus.PRESENT }];
      mockPrisma.attendance.findMany.mockResolvedValueOnce(mockAttendance);

      const result = await service.getStudentAttendance('s1');

      expect(result).toEqual(mockAttendance);
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('throws NotFoundException when student is not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce(null);

      await expect(service.getStudentAttendance('unknown-id')).rejects.toThrow(
        new NotFoundException('Student not found'),
      );
      expect(mockPrisma.attendance.findMany).not.toHaveBeenCalled();
    });

    it('applies date range filter when both from and to are provided', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's1' });
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getStudentAttendance('s1', '2024-01-01', '2024-03-31');

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({
        studentId: 's1',
        date: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-03-31'),
        },
      });
    });

    it('applies only gte filter when only from is provided', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's1' });
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getStudentAttendance('s1', '2024-01-01', undefined);

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({
        studentId: 's1',
        date: { gte: new Date('2024-01-01') },
      });
      expect(callArgs.where.date.lte).toBeUndefined();
    });

    it('applies only lte filter when only to is provided', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's1' });
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getStudentAttendance('s1', undefined, '2024-06-30');

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({
        studentId: 's1',
        date: { lte: new Date('2024-06-30') },
      });
      expect(callArgs.where.date.gte).toBeUndefined();
    });

    it('omits date filter entirely when neither from nor to is provided', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's1' });
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getStudentAttendance('s1');

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({ studentId: 's1' });
      expect(callArgs.where.date).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getClassSummary
  // ---------------------------------------------------------------------------
  describe('getClassSummary', () => {
    it('throws NotFoundException when class is not found', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce(null);

      await expect(service.getClassSummary('missing-class', '2024-01-01', '2024-01-31')).rejects.toThrow(
        new NotFoundException('Class not found'),
      );
      expect(mockPrisma.attendance.findMany).not.toHaveBeenCalled();
    });

    it('correct rate: 3 PRESENT + 1 LATE + 1 ABSENT = total 5, rate = 80%', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });

      const makeRecord = (status: AttendanceStatus) => ({
        studentId: 's1',
        status,
        student: { user: { firstName: 'Alice', lastName: 'Smith', avatarUrl: null } },
      });

      mockPrisma.attendance.findMany.mockResolvedValueOnce([
        makeRecord(AttendanceStatus.PRESENT),
        makeRecord(AttendanceStatus.PRESENT),
        makeRecord(AttendanceStatus.PRESENT),
        makeRecord(AttendanceStatus.LATE),
        makeRecord(AttendanceStatus.ABSENT),
      ]);

      const result = await service.getClassSummary('class1', '2024-01-01', '2024-01-31');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        studentId: 's1',
        present: 3,
        late: 1,
        absent: 1,
        excused: 0,
        total: 5,
        rate: 80, // Math.round((4/5)*100)
      });
    });

    it('correctly counts each status type across multiple records', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });

      const makeRecord = (status: AttendanceStatus) => ({
        studentId: 's2',
        status,
        student: { user: { firstName: 'Bob', lastName: 'Jones', avatarUrl: 'http://avatar.url' } },
      });

      mockPrisma.attendance.findMany.mockResolvedValueOnce([
        makeRecord(AttendanceStatus.PRESENT),
        makeRecord(AttendanceStatus.ABSENT),
        makeRecord(AttendanceStatus.LATE),
        makeRecord(AttendanceStatus.EXCUSED),
        makeRecord(AttendanceStatus.EXCUSED),
      ]);

      const result = await service.getClassSummary('class1', '2024-02-01', '2024-02-28');

      expect(result[0]).toMatchObject({
        studentId: 's2',
        present: 1,
        absent: 1,
        late: 1,
        excused: 2,
        total: 5,
        rate: Math.round(((1 + 1) / 5) * 100), // 40
      });
    });

    it('rate = 0 when total = 0 (no attendance records for student)', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });
      // findMany returns empty — no records at all, so summaryMap is empty
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      const result = await service.getClassSummary('class1', '2024-01-01', '2024-01-31');

      expect(result).toHaveLength(0);
    });

    it('groups records by student so each student gets its own summary entry', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });

      mockPrisma.attendance.findMany.mockResolvedValueOnce([
        {
          studentId: 's1',
          status: AttendanceStatus.PRESENT,
          student: { user: { firstName: 'Alice', lastName: 'Smith', avatarUrl: null } },
        },
        {
          studentId: 's2',
          status: AttendanceStatus.ABSENT,
          student: { user: { firstName: 'Bob', lastName: 'Jones', avatarUrl: null } },
        },
        {
          studentId: 's1',
          status: AttendanceStatus.LATE,
          student: { user: { firstName: 'Alice', lastName: 'Smith', avatarUrl: null } },
        },
      ]);

      const result = await service.getClassSummary('class1', '2024-01-01', '2024-01-31');

      expect(result).toHaveLength(2);
      const alice = result.find((r) => r.studentId === 's1');
      const bob = result.find((r) => r.studentId === 's2');

      expect(alice).toMatchObject({ present: 1, late: 1, total: 2, rate: 100 });
      expect(bob).toMatchObject({ absent: 1, total: 1, rate: 0 });
    });

    it('queries findMany with gte/lte date range derived from from/to strings', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });
      mockPrisma.attendance.findMany.mockResolvedValueOnce([]);

      await service.getClassSummary('class1', '2024-04-01', '2024-04-30');

      const callArgs = mockPrisma.attendance.findMany.mock.calls[0][0];
      expect(callArgs.where).toMatchObject({
        classId: 'class1',
        date: {
          gte: new Date('2024-04-01'),
          lte: new Date('2024-04-30'),
        },
      });
    });

    it('includes name and avatarUrl from student.user in each summary entry', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });

      mockPrisma.attendance.findMany.mockResolvedValueOnce([
        {
          studentId: 's3',
          status: AttendanceStatus.PRESENT,
          student: {
            user: { firstName: 'Carol', lastName: 'White', avatarUrl: 'http://img.test/carol.png' },
          },
        },
      ]);

      const result = await service.getClassSummary('class1', '2024-01-01', '2024-01-31');

      expect(result[0].name).toBe('Carol White');
      expect(result[0].avatarUrl).toBe('http://img.test/carol.png');
    });
  });

  // ---------------------------------------------------------------------------
  // getClassRoster
  // ---------------------------------------------------------------------------
  describe('getClassRoster', () => {
    it('throws NotFoundException when class is not found', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce(null);

      await expect(service.getClassRoster('missing-class')).rejects.toThrow(
        new NotFoundException('Class not found'),
      );
      expect(mockPrisma.student.findMany).not.toHaveBeenCalled();
    });

    it('happy path: returns students with user includes when class exists', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1', name: 'Math 101' });
      const mockStudents = [
        {
          id: 's1',
          classId: 'class1',
          user: { id: 'u1', firstName: 'Alice', lastName: 'Smith', avatarUrl: null, email: 'alice@test.com' },
        },
        {
          id: 's2',
          classId: 'class1',
          user: { id: 'u2', firstName: 'Bob', lastName: 'Jones', avatarUrl: null, email: 'bob@test.com' },
        },
      ];
      mockPrisma.student.findMany.mockResolvedValueOnce(mockStudents);

      const result = await service.getClassRoster('class1');

      expect(result).toEqual(mockStudents);
      expect(mockPrisma.student.findMany).toHaveBeenCalledTimes(1);
    });

    it('queries students filtered by classId and ordered by user.firstName asc', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class1' });
      mockPrisma.student.findMany.mockResolvedValueOnce([]);

      await service.getClassRoster('class1');

      const callArgs = mockPrisma.student.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({ classId: 'class1' });
      expect(callArgs.orderBy).toEqual({ user: { firstName: 'asc' } });
      expect(callArgs.include.user.select).toMatchObject({
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        email: true,
      });
    });

    it('verifies schoolClass.findUnique is called with correct classId', async () => {
      mockPrisma.schoolClass.findUnique.mockResolvedValueOnce({ id: 'class-xyz' });
      mockPrisma.student.findMany.mockResolvedValueOnce([]);

      await service.getClassRoster('class-xyz');

      expect(mockPrisma.schoolClass.findUnique).toHaveBeenCalledWith({ where: { id: 'class-xyz' } });
    });
  });
});
