import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getChildren(parentUserId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: parentUserId },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
                school: { select: { name: true } },
                class: { select: { name: true, grade: true } },
                _count: { select: { courseProgress: true } },
              },
            },
          },
        },
      },
    });
    if (!parent) {throw new NotFoundException('Parent profile not found');}
    return parent.children.map(c => c.student);
  }

  async getChildProgress(parentUserId: string, studentId: string) {
    await this.verifyParentAccess(parentUserId, studentId);

    return this.prisma.courseProgress.findMany({
      where: { studentId },
      include: { course: { select: { title: true, thumbnailUrl: true, totalLessons: true } } },
      orderBy: { lastAccessedAt: 'desc' },
    });
  }

  async getChildSubmissions(parentUserId: string, studentId: string) {
    await this.verifyParentAccess(parentUserId, studentId);

    return this.prisma.submission.findMany({
      where: { studentId },
      include: { assignment: { select: { title: true, maxScore: true, dueDate: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 30,
    });
  }

  async getChildAttendance(parentUserId: string, studentId: string) {
    await this.verifyParentAccess(parentUserId, studentId);

    return this.prisma.liveParticipant.findMany({
      where: { userId: studentId },
      include: { session: { select: { title: true, scheduledAt: true, status: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 30,
    });
  }

  async linkChild(parentUserId: string, studentId: string, relationship = 'parent') {
    const parent = await this.prisma.parent.findUnique({ where: { userId: parentUserId } });
    if (!parent) {throw new NotFoundException('Parent profile not found');}

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {throw new NotFoundException('Student not found');}

    return this.prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId } },
      update: { relationship },
      create: { parentId: parent.id, studentId, relationship },
    });
  }

  private async verifyParentAccess(parentUserId: string, studentId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { userId: parentUserId } });
    if (!parent) {throw new ForbiddenException('Not a parent');}
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parent.id, studentId } },
    });
    if (!link) {throw new ForbiddenException('Not linked to this student');}
  }
}
