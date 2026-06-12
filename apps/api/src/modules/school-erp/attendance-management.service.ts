import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export interface AttendanceSummary {
  classId: string;
  from: Date;
  to: Date;
  totalDays: number;
  students: Array<{
    studentId: string;
    studentName: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    rate: number;
  }>;
}

export interface AttendanceRecord {
  id: string;
  date: Date;
  status: AttendanceStatus;
  note: string | null;
  classId: string;
  className: string | null;
}

export interface FlaggedStudent {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  parentEmail: string | null;
}

@Injectable()
export class AttendanceManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mark attendance for an entire class at once */
  async markBulkAttendance(
    classId: string,
    date: Date,
    records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>,
    markedById: string,
  ): Promise<void> {
    const schoolClass = await this.prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!schoolClass) {throw new NotFoundException('Class not found');}

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const upserts = records.map((record) =>
      this.prisma.attendance.upsert({
        where: {
          classId_studentId_date: {
            classId,
            studentId: record.studentId,
            date: dateOnly,
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
          date: dateOnly,
          status: record.status,
          note: record.note ?? null,
          markedById,
        },
      }),
    );

    await this.prisma.$transaction(upserts);
  }

  /** Get attendance summary for a class over a date range */
  async getClassAttendanceSummary(
    classId: string,
    from: Date,
    to: Date,
  ): Promise<AttendanceSummary> {
    const schoolClass = await this.prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!schoolClass) {throw new NotFoundException('Class not found');}

    const records = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: { gte: from, lte: to },
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Count distinct days
    const distinctDays = new Set(records.map((r) => r.date.toISOString().split('T')[0]));
    const totalDays = distinctDays.size;

    const summaryMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        present: number;
        absent: number;
        late: number;
        excused: number;
        total: number;
      }
    >();

    for (const record of records) {
      if (!summaryMap.has(record.studentId)) {
        summaryMap.set(record.studentId, {
          studentId: record.studentId,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }
      const entry = summaryMap.get(record.studentId)!;
      entry.total++;
      switch (record.status) {
        case AttendanceStatus.PRESENT: entry.present++; break;
        case AttendanceStatus.ABSENT: entry.absent++; break;
        case AttendanceStatus.LATE: entry.late++; break;
        case AttendanceStatus.EXCUSED: entry.excused++; break;
      }
    }

    const students = Array.from(summaryMap.values()).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0,
    }));

    return { classId, from, to, totalDays, students };
  }

  /** Get a student's attendance history */
  async getStudentAttendance(
    studentId: string,
    from?: Date,
    to?: Date,
  ): Promise<AttendanceRecord[]> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {throw new NotFoundException('Student not found');}

    const where: Record<string, unknown> = { studentId };
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {dateFilter.gte = from;}
      if (to) {dateFilter.lte = to;}
      where.date = dateFilter;
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      note: r.note,
      classId: r.classId,
      className: r.class.name,
    }));
  }

  /** Calculate attendance rate (percentage present) for a student */
  async getAttendanceRate(studentId: string, classId?: string): Promise<number> {
    const where: Record<string, unknown> = { studentId };
    if (classId) {where.classId = classId;}

    const total = await this.prisma.attendance.count({ where });
    if (total === 0) {return 0;}

    const present = await this.prisma.attendance.count({
      where: {
        ...where,
        status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] },
      },
    });

    return Math.round((present / total) * 100);
  }

  /** Flag students with attendance below threshold (default 75%) */
  async getFlaggedStudents(
    classId: string,
    thresholdPercent = 75,
  ): Promise<FlaggedStudent[]> {
    const schoolClass = await this.prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!schoolClass) {throw new NotFoundException('Class not found');}

    const students = await this.prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { firstName: true, lastName: true, parentEmail: true } },
        parentLinks: {
          include: {
            parent: {
              include: { user: { select: { email: true } } },
            },
          },
        },
      },
    });

    const flagged: FlaggedStudent[] = [];

    for (const student of students) {
      const total = await this.prisma.attendance.count({ where: { studentId: student.id, classId } });
      if (total === 0) {continue;}

      const daysPresent = await this.prisma.attendance.count({
        where: {
          studentId: student.id,
          classId,
          status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] },
        },
      });

      const rate = Math.round((daysPresent / total) * 100);
      if (rate < thresholdPercent) {
        const daysAbsent = await this.prisma.attendance.count({
          where: { studentId: student.id, classId, status: AttendanceStatus.ABSENT },
        });

        // Get parent email from parentLinks or user.parentEmail
        let parentEmail: string | null = student.user.parentEmail ?? null;
        if (!parentEmail && student.parentLinks.length > 0) {
          parentEmail = student.parentLinks[0].parent.user.email;
        }

        flagged.push({
          studentId: student.id,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          attendanceRate: rate,
          totalDays: total,
          daysPresent,
          daysAbsent,
          parentEmail,
        });
      }
    }

    return flagged.sort((a, b) => a.attendanceRate - b.attendanceRate);
  }

  /** Send absence alerts to parents of students absent on a given date */
  async sendAbsenceAlerts(classId: string, date: Date): Promise<number> {
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const absentRecords = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: dateOnly,
        status: AttendanceStatus.ABSENT,
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, parentEmail: true } },
            parentLinks: {
              include: {
                parent: {
                  include: { user: { select: { email: true } } },
                },
              },
            },
          },
        },
        class: { select: { name: true } },
      },
    });

    let alertsSent = 0;

    for (const record of absentRecords) {
      // Get parent emails
      const parentEmails: string[] = [];
      if (record.student.user.parentEmail) {
        parentEmails.push(record.student.user.parentEmail);
      }
      for (const link of record.student.parentLinks) {
        parentEmails.push(link.parent.user.email);
      }

      if (parentEmails.length === 0) {continue;}

      // Create in-app notifications for the student and parent
      // In a real implementation, this would also send emails/SMS
      const studentName = `${record.student.user.firstName} ${record.student.user.lastName}`;
      const className = record.class.name;
      const dateStr = dateOnly.toISOString().split('T')[0];

      // Create notification record for tracking
      await this.prisma.notification.create({
        data: {
          userId: record.student.userId,
          type: 'IN_APP',
          title: 'Absence Recorded',
          body: `You were marked absent in ${className} on ${dateStr}. Your parent/guardian has been notified.`,
          data: { classId, date: dateStr, type: 'absence_alert' },
        },
      });

      alertsSent++;
    }

    return alertsSent;
  }
}
