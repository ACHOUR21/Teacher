import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SchoolErpService {
  constructor(private readonly prisma: PrismaService) {}

  async createSchool(tenantId: string, dto: { name: string; code?: string; address?: object; phone?: string; email?: string }) {
    return this.prisma.school.create({ data: { tenantId, ...dto } });
  }

  async getSchools(tenantId: string) {
    return this.prisma.school.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: { select: { departments: true, classes: true, teachers: true, students: true } },
      },
    });
  }

  async getSchool(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        departments: { include: { _count: { select: { classes: true } } } },
        classes: { include: { _count: { select: { students: true } } } },
        _count: { select: { teachers: true, students: true } },
      },
    });
    if (!school) {throw new NotFoundException('School not found');}
    return school;
  }

  async createDepartment(schoolId: string, dto: { name: string; code?: string; headId?: string }) {
    return this.prisma.department.create({ data: { schoolId, ...dto } });
  }

  async getDepartments(schoolId: string) {
    return this.prisma.department.findMany({
      where: { schoolId },
      include: { _count: { select: { classes: true } } },
    });
  }

  async createClass(schoolId: string, dto: { name: string; grade: string; section?: string; academicYear: string; capacity?: number; departmentId?: string }) {
    return this.prisma.schoolClass.create({ data: { schoolId, ...dto } });
  }

  async getClasses(schoolId: string) {
    return this.prisma.schoolClass.findMany({
      where: { schoolId },
      include: {
        department: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });
  }

  async getTimetable(classId: string) {
    return this.prisma.timetable.findMany({
      where: { classId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async createTimetableEntry(classId: string, dto: { dayOfWeek: number; startTime: string; endTime: string; subjectId?: string; teacherId?: string; room?: string }) {
    return this.prisma.timetable.create({ data: { classId, ...dto } });
  }

  async deleteTimetableEntry(id: string) {
    const entry = await this.prisma.timetable.findUnique({ where: { id } });
    if (!entry) {throw new NotFoundException('Timetable entry not found');}
    return this.prisma.timetable.delete({ where: { id } });
  }

  async getSchoolStats(schoolId: string) {
    const [totalStudents, totalTeachers, totalClasses, activeSessions] = await Promise.all([
      this.prisma.student.count({ where: { schoolId } }),
      this.prisma.teacher.count({ where: { schoolId } }),
      this.prisma.schoolClass.count({ where: { schoolId } }),
      this.prisma.liveSession.count({ where: { teacher: { schoolId }, status: 'LIVE' } }),
    ]);
    return { totalStudents, totalTeachers, totalClasses, activeSessions };
  }

  async assignStudentToClass(studentId: string, classId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {throw new NotFoundException('Student not found');}
    return this.prisma.student.update({
      where: { id: studentId },
      data: { classId },
    });
  }

  async removeStudentFromClass(studentId: string, classId: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, classId } });
    if (!student) {throw new NotFoundException('Student not found in this class');}
    return this.prisma.student.update({
      where: { id: studentId },
      data: { classId: null },
    });
  }

  async getClassStudents(classId: string) {
    return this.prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });
  }

  async assignTeacherToSchool(teacherId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {throw new NotFoundException('Teacher not found');}
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { schoolId },
    });
  }

  async getSchoolTeachers(schoolId: string) {
    return this.prisma.teacher.findMany({
      where: { schoolId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });
  }
}
