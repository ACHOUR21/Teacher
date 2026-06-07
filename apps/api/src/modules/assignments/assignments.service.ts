import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApiEcosystemService } from '../api-ecosystem/api-ecosystem.service';
import { AssignmentStatus } from '@prisma/client';

export class CreateAssignmentDto {
  title: string;
  description?: string;
  lessonId?: string;
  dueDate?: string;
  maxScore?: number;
  attachments?: string[];
}

export class SubmitAssignmentDto {
  content?: string;
  attachments?: string[];
}

export class GradeSubmissionDto {
  score: number;
  feedback?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly apiEcosystem: ApiEcosystemService,
  ) {}

  async create(teacherId: string, dto: CreateAssignmentDto) {
    const assignment = await this.prisma.assignment.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        lessonId: dto.lessonId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxScore: dto.maxScore ?? 100,
        attachments: dto.attachments ?? [],
      },
    });

    // fire-and-forget notification to enrolled students
    if (dto.lessonId) {
      this.prisma.courseProgress.findMany({
        where: { course: { sections: { some: { lessons: { some: { id: dto.lessonId } } } } } },
        include: { student: { select: { userId: true } } },
      }).then(async (enrollments) => {
        for (const e of enrollments) {
          if (e.student?.userId) {
            await this.notifications.notifyUser(
              e.student.userId,
              'New Assignment',
              `A new assignment "${dto.title}" has been posted`,
              { type: 'ASSIGNMENT_DUE', assignmentId: assignment.id }
            ).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    return assignment;
  }

  async findAll(teacherId?: string, studentId?: string, lessonId?: string) {
    const where: Record<string, unknown> = {};
    if (teacherId) where.teacherId = teacherId;
    if (lessonId) where.lessonId = lessonId;

    const assignments = await this.prisma.assignment.findMany({
      where,
      include: {
        _count: { select: { submissions: true } },
        ...(studentId && {
          submissions: {
            where: { studentId },
            select: { id: true, status: true, score: true, submittedAt: true },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments;
  }

  async findById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true } },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async update(id: string, teacherId: string, dto: Partial<CreateAssignmentDto>) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.teacherId !== teacherId) throw new ForbiddenException('Not your assignment');

    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.maxScore !== undefined && { maxScore: dto.maxScore }),
        ...(dto.attachments && { attachments: dto.attachments }),
      },
    });
  }

  async delete(id: string, teacherId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.teacherId !== teacherId) throw new ForbiddenException('Not your assignment');
    await this.prisma.assignment.delete({ where: { id } });
  }

  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    let status: AssignmentStatus;

    if (assignment.dueDate && new Date() > assignment.dueDate) {
      const existing = await this.prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
      });
      if (existing) throw new ConflictException('Already submitted');
      status = AssignmentStatus.LATE;
    } else {
      const existing = await this.prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
      });
      if (existing) throw new ConflictException('Already submitted');
      status = AssignmentStatus.SUBMITTED;
    }

    const submission = await this.prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        content: dto.content,
        attachments: dto.attachments ?? [],
        status,
        submittedAt: new Date(),
      },
    });

    // Fire-and-forget webhook
    this.prisma.teacher
      .findUnique({ where: { id: assignment.teacherId ?? '' }, include: { user: { select: { tenantId: true } } } })
      .then((teacher) => {
        const tenantId = teacher?.user?.tenantId ?? '';
        if (tenantId) {
          this.apiEcosystem
            .deliverWebhook(tenantId, 'assignment.submitted', { assignmentId, studentId, status })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return submission;
  }

  async getSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.teacherId !== teacherId) throw new ForbiddenException('Not your assignment');

    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async getMySubmission(assignmentId: string, studentId: string) {
    return this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
  }

  async grade(submissionId: string, teacherId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, student: { select: { userId: true } } },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.assignment.teacherId !== teacherId) throw new ForbiddenException('Not your assignment');
    if (dto.score < 0 || dto.score > submission.assignment.maxScore) {
      throw new BadRequestException(`Score must be between 0 and ${submission.assignment.maxScore}`);
    }

    const result = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        status: AssignmentStatus.GRADED,
        gradedAt: new Date(),
      },
    });

    // notify the student
    const studentUserId = submission.student?.userId ??
      (await this.prisma.student.findUnique({ where: { id: submission.studentId }, select: { userId: true } }))?.userId;
    if (studentUserId) {
      await this.notifications.notifyUser(
        studentUserId,
        'Assignment Graded',
        `You scored ${dto.score}/${submission.assignment.maxScore} on "${submission.assignment.title}"`,
        { type: 'GRADE_PUBLISHED', assignmentId: submission.assignmentId }
      );
    }

    // Fire-and-forget webhook
    this.prisma.teacher
      .findUnique({ where: { id: teacherId }, include: { user: { select: { tenantId: true } } } })
      .then((teacher) => {
        const tenantId = teacher?.user?.tenantId ?? '';
        if (tenantId) {
          this.apiEcosystem
            .deliverWebhook(tenantId, 'assignment.graded', {
              submissionId,
              score: dto.score,
              passed: dto.score >= submission.assignment.maxScore * 0.7,
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return result;
  }

  async getStudentAssignments(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const enrolledCourses = await this.prisma.courseProgress.findMany({
      where: { studentId },
      select: { courseId: true },
    });
    const courseIds = enrolledCourses.map((e) => e.courseId);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        OR: [
          { lesson: { section: { courseId: { in: courseIds } } } },
          { teacherId: { not: null } },
        ],
      },
      include: {
        submissions: {
          where: { studentId },
          select: { id: true, status: true, score: true, submittedAt: true, gradedAt: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return assignments;
  }
}
