import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AssignmentStatus } from '@prisma/client';

import { ApiEcosystemService } from '../../api-ecosystem/api-ecosystem.service';
import { PrismaService } from '../../database/prisma.service';
import { ParentNotificationsService } from '../../notifications/parent-notifications.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AssignmentsService } from '../assignments.service';


const mockPrisma = {
  assignment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  submission: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  student: {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  courseProgress: {
    findMany: jest.fn(),
  },
  teacher: {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
  },
};

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue({}),
            sendToUser: jest.fn().mockResolvedValue({}),
            notifyUser: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ApiEcosystemService,
          useValue: {
            deliverWebhook: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ParentNotificationsService,
          useValue: {
            notifyGradePosted: jest.fn().mockResolvedValue(undefined),
            notifyAssignmentDue: jest.fn().mockResolvedValue(undefined),
            notifySubmissionGraded: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an assignment with default maxScore of 100', async () => {
      const created = {
        id: 'assign-1',
        teacherId: 'teacher-1',
        title: 'Homework 1',
        maxScore: 100,
        attachments: [],
      };
      mockPrisma.assignment.create.mockResolvedValueOnce(created);

      const result = await service.create('teacher-1', { title: 'Homework 1' });

      expect(result.id).toBe('assign-1');
      expect(result.maxScore).toBe(100);
      expect(mockPrisma.assignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ teacherId: 'teacher-1', title: 'Homework 1', maxScore: 100 }),
        }),
      );
    });

    it('should create an assignment with a due date when provided', async () => {
      const dueDate = '2026-07-01';
      const created = {
        id: 'assign-2',
        teacherId: 'teacher-1',
        title: 'Essay',
        dueDate: new Date(dueDate),
        maxScore: 50,
        attachments: [],
      };
      mockPrisma.assignment.create.mockResolvedValueOnce(created);

      const result = await service.create('teacher-1', { title: 'Essay', dueDate, maxScore: 50 });

      expect(result.dueDate).toEqual(new Date(dueDate));
      expect(mockPrisma.assignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dueDate: new Date(dueDate), maxScore: 50 }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all assignments without filters', async () => {
      const mockAssignments = [
        { id: 'assign-1', title: 'Homework 1', _count: { submissions: 3 } },
        { id: 'assign-2', title: 'Essay', _count: { submissions: 1 } },
      ];
      mockPrisma.assignment.findMany.mockResolvedValueOnce(mockAssignments);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should filter by teacherId when provided', async () => {
      mockPrisma.assignment.findMany.mockResolvedValueOnce([]);

      await service.findAll('teacher-1');

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teacherId: 'teacher-1' }),
        }),
      );
    });

    it('should include student submissions when studentId is provided', async () => {
      mockPrisma.assignment.findMany.mockResolvedValueOnce([]);

      await service.findAll(undefined, 'student-1');

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            submissions: expect.objectContaining({
              where: { studentId: 'student-1' },
            }),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return the assignment when it exists', async () => {
      const mockAssignment = { id: 'assign-1', title: 'Homework 1', _count: { submissions: 2 } };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(mockAssignment);

      const result = await service.findById('assign-1');

      expect(result.id).toBe('assign-1');
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update assignment when teacher owns it', async () => {
      const existing = { id: 'assign-1', teacherId: 'teacher-1', title: 'Old Title' };
      const updated = { id: 'assign-1', teacherId: 'teacher-1', title: 'New Title' };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.assignment.update.mockResolvedValueOnce(updated);

      const result = await service.update('assign-1', 'teacher-1', { title: 'New Title' });

      expect(result.title).toBe('New Title');
      expect(mockPrisma.assignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'assign-1' },
          data: expect.objectContaining({ title: 'New Title' }),
        }),
      );
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(null);

      await expect(service.update('nonexistent', 'teacher-1', { title: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when teacher does not own the assignment', async () => {
      const existing = { id: 'assign-1', teacherId: 'teacher-other' };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(existing);

      await expect(service.update('assign-1', 'teacher-1', { title: 'X' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete assignment when teacher owns it', async () => {
      const existing = { id: 'assign-1', teacherId: 'teacher-1' };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.assignment.delete.mockResolvedValueOnce(existing);

      await service.delete('assign-1', 'teacher-1');

      expect(mockPrisma.assignment.delete).toHaveBeenCalledWith({ where: { id: 'assign-1' } });
    });

    it('should throw ForbiddenException when teacher does not own the assignment', async () => {
      const existing = { id: 'assign-1', teacherId: 'teacher-other' };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(existing);

      await expect(service.delete('assign-1', 'teacher-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete('nonexistent', 'teacher-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    it('should create a SUBMITTED submission before the due date', async () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      const assignment = { id: 'assign-1', dueDate: futureDate };
      const createdSubmission = {
        id: 'sub-1',
        assignmentId: 'assign-1',
        studentId: 'student-1',
        status: AssignmentStatus.SUBMITTED,
      };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(assignment);
      mockPrisma.submission.findUnique.mockResolvedValueOnce(null);
      mockPrisma.submission.create.mockResolvedValueOnce(createdSubmission);

      const result = await service.submit('assign-1', 'student-1', { content: 'My answer' });

      expect(result.status).toBe(AssignmentStatus.SUBMITTED);
      expect(mockPrisma.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: AssignmentStatus.SUBMITTED }),
        }),
      );
    });

    it('should create a LATE submission when past the due date', async () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      const assignment = { id: 'assign-1', dueDate: pastDate };
      const createdSubmission = {
        id: 'sub-2',
        assignmentId: 'assign-1',
        studentId: 'student-1',
        status: AssignmentStatus.LATE,
      };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(assignment);
      mockPrisma.submission.findUnique.mockResolvedValueOnce(null);
      mockPrisma.submission.create.mockResolvedValueOnce(createdSubmission);

      const result = await service.submit('assign-1', 'student-1', { content: 'Late answer' });

      expect(result.status).toBe(AssignmentStatus.LATE);
    });

    it('should throw ConflictException when student already submitted', async () => {
      const assignment = { id: 'assign-1', dueDate: null };
      const existingSubmission = { id: 'sub-1', assignmentId: 'assign-1', studentId: 'student-1' };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(assignment);
      mockPrisma.submission.findUnique.mockResolvedValueOnce(existingSubmission);

      await expect(service.submit('assign-1', 'student-1', {})).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(null);

      await expect(service.submit('nonexistent', 'student-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubmissions', () => {
    it('should return all submissions for an owned assignment', async () => {
      const assignment = { id: 'assign-1', teacherId: 'teacher-1' };
      const submissions = [
        { id: 'sub-1', studentId: 'student-1', student: { user: { firstName: 'Alice', lastName: 'Smith' } } },
      ];
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(assignment);
      mockPrisma.submission.findMany.mockResolvedValueOnce(submissions);

      const result = await service.getSubmissions('assign-1', 'teacher-1');

      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException when teacher does not own the assignment', async () => {
      const assignment = { id: 'assign-1', teacherId: 'teacher-other' };
      mockPrisma.assignment.findUnique.mockResolvedValueOnce(assignment);

      await expect(service.getSubmissions('assign-1', 'teacher-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('grade', () => {
    it('should grade a submission with a valid score', async () => {
      const submission = {
        id: 'sub-1',
        assignment: { teacherId: 'teacher-1', maxScore: 100 },
      };
      const gradedSubmission = {
        id: 'sub-1',
        score: 85,
        status: AssignmentStatus.GRADED,
        feedback: 'Good work',
      };
      mockPrisma.submission.findUnique.mockResolvedValueOnce(submission);
      mockPrisma.submission.update.mockResolvedValueOnce(gradedSubmission);

      const result = await service.grade('sub-1', 'teacher-1', { score: 85, feedback: 'Good work' });

      expect(result.score).toBe(85);
      expect(result.status).toBe(AssignmentStatus.GRADED);
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      mockPrisma.submission.findUnique.mockResolvedValueOnce(null);

      await expect(service.grade('nonexistent', 'teacher-1', { score: 80 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when teacher does not own the assignment', async () => {
      const submission = {
        id: 'sub-1',
        assignment: { teacherId: 'teacher-other', maxScore: 100 },
      };
      mockPrisma.submission.findUnique.mockResolvedValueOnce(submission);

      await expect(service.grade('sub-1', 'teacher-1', { score: 80 })).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when score exceeds maxScore', async () => {
      const submission = {
        id: 'sub-1',
        assignment: { teacherId: 'teacher-1', maxScore: 100 },
      };
      mockPrisma.submission.findUnique.mockResolvedValueOnce(submission);

      await expect(service.grade('sub-1', 'teacher-1', { score: 150 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when score is negative', async () => {
      const submission = {
        id: 'sub-1',
        assignment: { teacherId: 'teacher-1', maxScore: 100 },
      };
      mockPrisma.submission.findUnique.mockResolvedValueOnce(submission);

      await expect(service.grade('sub-1', 'teacher-1', { score: -1 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStudentAssignments', () => {
    it('should return assignments for enrolled student courses', async () => {
      const student = { id: 'student-1', userId: 'user-1' };
      const enrolledCourses = [{ courseId: 'course-1' }, { courseId: 'course-2' }];
      const assignments = [
        { id: 'assign-1', title: 'Homework 1', dueDate: new Date(), submissions: [] },
      ];
      mockPrisma.student.findUnique.mockResolvedValueOnce(student);
      mockPrisma.courseProgress.findMany.mockResolvedValueOnce(enrolledCourses);
      mockPrisma.assignment.findMany.mockResolvedValueOnce(assignments);

      const result = await service.getStudentAssignments('student-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce(null);

      await expect(service.getStudentAssignments('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
