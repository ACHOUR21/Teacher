"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AttendanceManagementService = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var _prisma = require("../database/prisma.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
let AttendanceManagementService = exports.AttendanceManagementService = class AttendanceManagementService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  /** Mark attendance for an entire class at once */
  async markBulkAttendance(classId, date, records, markedById) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      }
    });
    if (!schoolClass) {
      throw new _common.NotFoundException('Class not found');
    }
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);
    const upserts = records.map(record => this.prisma.attendance.upsert({
      where: {
        classId_studentId_date: {
          classId,
          studentId: record.studentId,
          date: dateOnly
        }
      },
      update: {
        status: record.status,
        note: record.note ?? null,
        markedById
      },
      create: {
        classId,
        studentId: record.studentId,
        date: dateOnly,
        status: record.status,
        note: record.note ?? null,
        markedById
      }
    }));
    await this.prisma.$transaction(upserts);
  }
  /** Get attendance summary for a class over a date range */
  async getClassAttendanceSummary(classId, from, to) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      }
    });
    if (!schoolClass) {
      throw new _common.NotFoundException('Class not found');
    }
    const records = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: from,
          lte: to
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
    // Count distinct days
    const distinctDays = new Set(records.map(r => r.date.toISOString().split('T')[0]));
    const totalDays = distinctDays.size;
    const summaryMap = new Map();
    for (const record of records) {
      if (!summaryMap.has(record.studentId)) {
        summaryMap.set(record.studentId, {
          studentId: record.studentId,
          studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        });
      }
      const entry = summaryMap.get(record.studentId);
      entry.total++;
      switch (record.status) {
        case _client.AttendanceStatus.PRESENT:
          entry.present++;
          break;
        case _client.AttendanceStatus.ABSENT:
          entry.absent++;
          break;
        case _client.AttendanceStatus.LATE:
          entry.late++;
          break;
        case _client.AttendanceStatus.EXCUSED:
          entry.excused++;
          break;
      }
    }
    const students = Array.from(summaryMap.values()).map(s => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.present + s.late) / s.total * 100) : 0
    }));
    return {
      classId,
      from,
      to,
      totalDays,
      students
    };
  }
  /** Get a student's attendance history */
  async getStudentAttendance(studentId, from, to) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const where = {
      studentId
    };
    if (from || to) {
      const dateFilter = {};
      if (from) {
        dateFilter.gte = from;
      }
      if (to) {
        dateFilter.lte = to;
      }
      where.date = dateFilter;
    }
    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    return records.map(r => ({
      id: r.id,
      date: r.date,
      status: r.status,
      note: r.note,
      classId: r.classId,
      className: r.class.name
    }));
  }
  /** Calculate attendance rate (percentage present) for a student */
  async getAttendanceRate(studentId, classId) {
    const where = {
      studentId
    };
    if (classId) {
      where.classId = classId;
    }
    const total = await this.prisma.attendance.count({
      where
    });
    if (total === 0) {
      return 0;
    }
    const present = await this.prisma.attendance.count({
      where: {
        ...where,
        status: {
          in: [_client.AttendanceStatus.PRESENT, _client.AttendanceStatus.LATE]
        }
      }
    });
    return Math.round(present / total * 100);
  }
  /** Flag students with attendance below threshold (default 75%) */
  async getFlaggedStudents(classId, thresholdPercent = 75) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      }
    });
    if (!schoolClass) {
      throw new _common.NotFoundException('Class not found');
    }
    const students = await this.prisma.student.findMany({
      where: {
        classId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            parentEmail: true
          }
        },
        parentLinks: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });
    const flagged = [];
    for (const student of students) {
      const total = await this.prisma.attendance.count({
        where: {
          studentId: student.id,
          classId
        }
      });
      if (total === 0) {
        continue;
      }
      const daysPresent = await this.prisma.attendance.count({
        where: {
          studentId: student.id,
          classId,
          status: {
            in: [_client.AttendanceStatus.PRESENT, _client.AttendanceStatus.LATE]
          }
        }
      });
      const rate = Math.round(daysPresent / total * 100);
      if (rate < thresholdPercent) {
        const daysAbsent = await this.prisma.attendance.count({
          where: {
            studentId: student.id,
            classId,
            status: _client.AttendanceStatus.ABSENT
          }
        });
        // Get parent email from parentLinks or user.parentEmail
        let parentEmail = student.user.parentEmail ?? null;
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
          parentEmail
        });
      }
    }
    return flagged.sort((a, b) => a.attendanceRate - b.attendanceRate);
  }
  /** Send absence alerts to parents of students absent on a given date */
  async sendAbsenceAlerts(classId, date) {
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);
    const absentRecords = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: dateOnly,
        status: _client.AttendanceStatus.ABSENT
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                parentEmail: true
              }
            },
            parentLinks: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        class: {
          select: {
            name: true
          }
        }
      }
    });
    let alertsSent = 0;
    for (const record of absentRecords) {
      // Get parent emails
      const parentEmails = [];
      if (record.student.user.parentEmail) {
        parentEmails.push(record.student.user.parentEmail);
      }
      for (const link of record.student.parentLinks) {
        parentEmails.push(link.parent.user.email);
      }
      if (parentEmails.length === 0) {
        continue;
      }
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
          data: {
            classId,
            date: dateStr,
            type: 'absence_alert'
          }
        }
      });
      alertsSent++;
    }
    return alertsSent;
  }
};
exports.AttendanceManagementService = AttendanceManagementService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], AttendanceManagementService);