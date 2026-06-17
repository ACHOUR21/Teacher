import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface CreateDepartmentDto {
  name: string;
  code: string;
  headFacultyId?: string;
}

export interface CreateFacultyMemberDto {
  userId: string;
  departmentId?: string;
  title?: string;
  specializations?: string[];
}

export interface CreateSemesterDto {
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
}

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Departments ────────────────────────────────────────────────────────────

  async getDepartments(tenantId: string) {
    const departments = await this.prisma.uniCourseDepartment.findMany({
      where: { tenantId },
      include: {
        _count: { select: { faculty: true, courses: true } },
      },
      orderBy: { name: 'asc' },
    });
    return departments;
  }

  async createDepartment(tenantId: string, dto: CreateDepartmentDto) {
    const existing = await this.prisma.uniCourseDepartment.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(`Department with code '${dto.code}' already exists`);
    }
    return this.prisma.uniCourseDepartment.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        headFacultyId: dto.headFacultyId,
      },
    });
  }

  // ─── Faculty Members ─────────────────────────────────────────────────────────

  async getFacultyMembers(tenantId: string, departmentId?: string) {
    return this.prisma.facultyMember.findMany({
      where: {
        tenantId,
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFacultyMember(tenantId: string, dto: CreateFacultyMemberDto) {
    const existing = await this.prisma.facultyMember.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('User is already a faculty member');
    }
    return this.prisma.facultyMember.create({
      data: {
        tenantId,
        userId: dto.userId,
        departmentId: dto.departmentId,
        title: dto.title ?? 'Lecturer',
        specializations: dto.specializations ?? [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Courses ─────────────────────────────────────────────────────────────────

  async getUniversityCourses(
    tenantId: string,
    departmentId?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...(departmentId ? { departmentId } : {}),
    };

    const [courses, total] = await Promise.all([
      this.prisma.uniCourse.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { enrollments: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.uniCourse.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Enrollment ──────────────────────────────────────────────────────────────

  async enrollStudent(
    tenantId: string,
    studentId: string,
    courseId: string,
    semesterId: string,
  ) {
    // Conflict detection: already enrolled and active
    const existing = await this.prisma.universityEnrollment.findFirst({
      where: {
        studentId,
        courseId,
        semesterId,
        status: 'ACTIVE',
      },
    });
    if (existing) {
      throw new ConflictException('Student is already enrolled in this course for this semester');
    }

    // Check if a dropped enrollment exists — allow re-enroll
    const dropped = await this.prisma.universityEnrollment.findFirst({
      where: { studentId, courseId, semesterId, status: 'DROPPED' },
    });
    if (dropped) {
      return this.prisma.universityEnrollment.update({
        where: { id: dropped.id },
        data: { status: 'ACTIVE', enrolledAt: new Date() },
      });
    }

    const enrollment = await this.prisma.universityEnrollment.create({
      data: {
        tenantId,
        studentId,
        courseId,
        semesterId,
        status: 'ACTIVE',
      },
    });

    // Increment enrollCount on course
    await this.prisma.uniCourse.update({
      where: { id: courseId },
      data: { enrollCount: { increment: 1 } },
    });

    return enrollment;
  }

  async dropCourse(tenantId: string, studentId: string, courseId: string) {
    const enrollment = await this.prisma.universityEnrollment.findFirst({
      where: { tenantId, studentId, courseId, status: 'ACTIVE' },
    });
    if (!enrollment) {
      throw new NotFoundException('Active enrollment not found');
    }

    const updated = await this.prisma.universityEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'DROPPED' },
    });

    // Decrement enrollCount
    await this.prisma.uniCourse.update({
      where: { id: courseId },
      data: { enrollCount: { decrement: 1 } },
    });

    return updated;
  }

  // ─── Transcript ──────────────────────────────────────────────────────────────

  async getTranscript(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const enrollments = await this.prisma.universityEnrollment.findMany({
      where: {
        tenantId,
        studentId,
        status: 'COMPLETED',
      },
      include: {
        course: {
          select: { id: true, title: true, credits: true, departmentId: true },
        },
        semester: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
      },
      orderBy: { enrolledAt: 'asc' },
    });

    const grades = enrollments
      .map((e) => e.grade)
      .filter((g): g is number => g !== null && g !== undefined);

    const gpa = this.calculateGpa(grades);

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        gpa: student.gpa,
        user: student.user,
      },
      enrollments,
      cumulativeGpa: gpa,
      totalCredits: enrollments.reduce(
        (sum, e) => sum + (e.course?.credits ?? 0),
        0,
      ),
      totalCourses: enrollments.length,
    };
  }

  // ─── GPA Calculation ─────────────────────────────────────────────────────────

  calculateGpa(grades: number[]): number {
    if (grades.length === 0) {return 0;}

    const gpaPoints = grades.map((score) => {
      if (score >= 90) {return 4.0;} // A
      if (score >= 80) {return 3.0;} // B
      if (score >= 70) {return 2.0;} // C
      if (score >= 60) {return 1.0;} // D
      return 0.0;                    // F
    });

    const sum = gpaPoints.reduce<number>((acc, p) => acc + p, 0);
    return Math.round((sum / gpaPoints.length) * 100) / 100;
  }

  // ─── Semesters ───────────────────────────────────────────────────────────────

  async createSemester(tenantId: string, dto: CreateSemesterDto) {
    const existing = await this.prisma.semester.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Semester '${dto.name}' already exists`);
    }

    // If this semester is active, deactivate others
    if (dto.isActive) {
      await this.prisma.semester.updateMany({
        where: { tenantId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.semester.create({
      data: {
        tenantId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? false,
      },
    });
  }

  async getActiveSemester(tenantId: string) {
    const semester = await this.prisma.semester.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { startDate: 'desc' },
    });
    if (!semester) {
      throw new NotFoundException('No active semester found');
    }
    return semester;
  }

  // ─── Dashboard Stats ─────────────────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    const [departmentCount, facultyCount, enrolledStudents, activeSemester] =
      await Promise.all([
        this.prisma.uniCourseDepartment.count({ where: { tenantId } }),
        this.prisma.facultyMember.count({ where: { tenantId } }),
        this.prisma.universityEnrollment.count({
          where: { tenantId, status: 'ACTIVE' },
        }),
        this.prisma.semester
          .findFirst({ where: { tenantId, isActive: true } })
          .catch(() => null),
      ]);

    return {
      departmentCount,
      facultyCount,
      enrolledStudents,
      activeSemesterName: activeSemester?.name ?? null,
    };
  }
}
