import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class UniversityErpService {
  constructor(private readonly prisma: PrismaService) {}

  async createUniversity(tenantId: string, dto: { name: string; code?: string; address?: object }) {
    return this.prisma.university.create({ data: { tenantId, ...dto } });
  }

  async getUniversities(tenantId: string) {
    return this.prisma.university.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { faculties: true, programs: true } } },
    });
  }

  async createFaculty(universityId: string, dto: { name: string; code?: string }) {
    return this.prisma.faculty.create({ data: { universityId, ...dto } });
  }

  async createProgram(universityId: string, dto: { name: string; code?: string; degree: string; durationYears: number; departmentId?: string }) {
    return this.prisma.academicProgram.create({ data: { universityId, ...dto } });
  }

  async getPrograms(universityId: string) {
    return this.prisma.academicProgram.findMany({
      where: { universityId },
      include: {
        department: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async enrollStudent(studentId: string, programId: string) {
    return this.prisma.enrollment.create({
      data: { studentId, programId, status: EnrollmentStatus.ACTIVE },
    });
  }

  async getEnrollments(programId: string) {
    return this.prisma.enrollment.findMany({
      where: { programId },
      include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
    });
  }

  async updateEnrollmentStatus(id: string, status: EnrollmentStatus) {
    return this.prisma.enrollment.update({
      where: { id },
      data: { status, ...(status === EnrollmentStatus.COMPLETED ? { completedAt: new Date() } : {}) },
    });
  }
}
