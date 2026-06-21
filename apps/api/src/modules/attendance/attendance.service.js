"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MarkAttendanceDto = exports.AttendanceService = exports.AttendanceRecordDto = void 0;
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
class AttendanceRecordDto {
  studentId;
  status;
  note;
}
exports.AttendanceRecordDto = AttendanceRecordDto;
class MarkAttendanceDto {
  classId;
  date;
  records;
}
exports.MarkAttendanceDto = MarkAttendanceDto;
let AttendanceService = exports.AttendanceService = class AttendanceService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async markAttendance(classId, date, records, markedById) {
    const parsedDate = new Date(date);
    const upserts = records.map(record => this.prisma.attendance.upsert({
      where: {
        classId_studentId_date: {
          classId,
          studentId: record.studentId,
          date: parsedDate
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
        date: parsedDate,
        status: record.status,
        note: record.note ?? null,
        markedById
      }
    }));
    return this.prisma.$transaction(upserts);
  }
  async getClassAttendance(classId, date) {
    const parsedDate = new Date(date);
    return this.prisma.attendance.findMany({
      where: {
        classId,
        date: parsedDate
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          user: {
            firstName: 'asc'
          }
        }
      }
    });
  }
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
        dateFilter.gte = new Date(from);
      }
      if (to) {
        dateFilter.lte = new Date(to);
      }
      where.date = dateFilter;
    }
    return this.prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }
  async getClassSummary(classId, from, to) {
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
          gte: new Date(from),
          lte: new Date(to)
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
    // Group by student
    const summaryMap = new Map();
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
          total: 0
        });
      }
      const entry = summaryMap.get(key);
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
    return Array.from(summaryMap.values()).map(entry => ({
      ...entry,
      rate: entry.total > 0 ? Math.round((entry.present + entry.late) / entry.total * 100) : 0
    }));
  }
  async getClassRoster(classId) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      }
    });
    if (!schoolClass) {
      throw new _common.NotFoundException('Class not found');
    }
    return this.prisma.student.findMany({
      where: {
        classId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });
  }
};
exports.AttendanceService = AttendanceService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], AttendanceService);