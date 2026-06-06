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

  async getUniversity(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            faculties: true,
            programs: true,
          },
        },
      },
    });
    if (!university) throw new NotFoundException('University not found');

    const enrollmentsCount = await this.prisma.enrollment.count({
      where: { program: { universityId: id } },
    });
    const activeStudents = await this.prisma.enrollment.count({
      where: { program: { universityId: id }, status: EnrollmentStatus.ACTIVE },
    });

    return { ...university, enrollmentsCount, activeStudents };
  }

  async updateUniversity(id: string, dto: { name?: string; code?: string }) {
    const existing = await this.prisma.university.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('University not found');
    return this.prisma.university.update({ where: { id }, data: dto });
  }

  async getFaculties(universityId: string) {
    return this.prisma.faculty.findMany({
      where: { universityId },
      include: { _count: { select: { departments: true } } },
    });
  }

  async createFaculty(universityId: string, dto: { name: string; code?: string }) {
    return this.prisma.faculty.create({ data: { universityId, ...dto } });
  }

  async deleteFaculty(id: string) {
    const existing = await this.prisma.faculty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Faculty not found');
    return this.prisma.faculty.delete({ where: { id } });
  }

  async createUniDepartment(facultyId: string, dto: { name: string; code?: string }) {
    return this.prisma.uniDepartment.create({ data: { facultyId, name: dto.name } });
  }

  async getDepartments(facultyId: string) {
    return this.prisma.uniDepartment.findMany({
      where: { facultyId },
      include: { _count: { select: { programs: true } } },
    });
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

  async getProgramEnrollmentStats(programId: string) {
    const [active, completed, suspended, withdrawn] = await Promise.all([
      this.prisma.enrollment.count({ where: { programId, status: EnrollmentStatus.ACTIVE } }),
      this.prisma.enrollment.count({ where: { programId, status: EnrollmentStatus.COMPLETED } }),
      this.prisma.enrollment.count({ where: { programId, status: EnrollmentStatus.SUSPENDED } }),
      this.prisma.enrollment.count({ where: { programId, status: EnrollmentStatus.WITHDRAWN } }),
    ]);
    return { active, completed, suspended, withdrawn, total: active + completed + suspended + withdrawn };
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

  async getStudentAcademicRecord(studentId: string, universityId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        enrollments: {
          where: { program: { universityId } },
          include: {
            program: {
              select: { name: true, code: true, degree: true, durationYears: true },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async getStudentGPA(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { gpa: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    return { gpa: student.gpa };
  }
}
