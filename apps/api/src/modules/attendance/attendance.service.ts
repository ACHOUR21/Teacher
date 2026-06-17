import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export class AttendanceRecordDto {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export class MarkAttendanceDto {
  classId: string;
  date: string;
  records: AttendanceRecordDto[];
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async markAttendance(
    classId: string,
    date: string,
    records: AttendanceRecordDto[],
    markedById: string,
  ) {
    const parsedDate = new Date(date);

    const upserts = records.map((record) =>
      this.prisma.attendance.upsert({
        where: {
          classId_studentId_date: {
            classId,
            studentId: record.studentId,
            date: parsedDate,
          },
        },
        update: {
          status: record.status,
          note: record.note ?? null,
          markedById,
        },
        create: {
          classId,
          studentId: record.studentId,
          date: parsedDate,
          status: record.status,
          note: record.note ?? null,
          markedById,
        },
      }),
    );

    return this.prisma.$transaction(upserts);
  }

  async getClassAttendance(classId: string, date: string) {
    const parsedDate = new Date(date);

    return this.prisma.attendance.findMany({
      where: { classId, date: parsedDate },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            firstName: 'asc',
          },
        },
      },
    });
  }

  async getStudentAttendance(studentId: string, from?: string, to?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {throw new NotFoundException('Student not found');}

    const where: Record<string, unknown> = { studentId };

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {dateFilter.gte = new Date(from);}
      if (to) {dateFilter.lte = new Date(to);}
      where.date = dateFilter;
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, grade: true, section: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getClassSummary(classId: string, from: string, to: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!schoolClass) {throw new NotFoundException('Class not found');}

    const records = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Group by student
    const summaryMap = new Map<
      string,
      {
        studentId: string;
        name: string;
        avatarUrl: string | null;
        present: number;
        absent: number;
        late: number;
        excused: number;
        total: number;
      }
    >();

    for (const record of records) {
      const key = record.studentId;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          studentId: key,
          name: `${record.student.user.firstName} ${record.student.user.lastName}`,
          avatarUrl: record.student.user.avatarUrl,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }

      const entry = summaryMap.get(key)!;
      entry.total++;

      switch (record.status) {
        case AttendanceStatus.PRESENT:
          entry.present++;
          break;
        case AttendanceStatus.ABSENT:
          entry.absent++;
          break;
        case AttendanceStatus.LATE:
          entry.late++;
          break;
        case AttendanceStatus.EXCUSED:
          entry.excused++;
          break;
      }
    }

    return Array.from(summaryMap.values()).map((entry) => ({
      ...entry,
      rate: entry.total > 0 ? Math.round(((entry.present + entry.late) / entry.total) * 100) : 0,
    }));
  }

  async getClassRoster(classId: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!schoolClass) {throw new NotFoundException('Class not found');}

    return this.prisma.student.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });
  }
}
