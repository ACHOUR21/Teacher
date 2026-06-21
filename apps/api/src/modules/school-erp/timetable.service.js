"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpsertTimetableSlotDto = exports.TimetableService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _redis = require("../cache/redis.service");
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
class UpsertTimetableSlotDto {
  classId;
  dayOfWeek;
  startTime;
  endTime;
  subjectId;
  teacherId;
  room;
  id; // present on update
}
exports.UpsertTimetableSlotDto = UpsertTimetableSlotDto;
function timesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}
let TimetableService = exports.TimetableService = class TimetableService {
  constructor(prisma, cache) {
    this.prisma = prisma;
    this.cache = cache;
  }
  /** Get weekly timetable for a class, grouped as an array of 5 days */
  async getClassTimetable(classId) {
    const cacheKey = `timetable:class:${classId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through
      }
    }
    const entries = await this.prisma.timetable.findMany({
      where: {
        classId
      },
      orderBy: [{
        dayOfWeek: 'asc'
      }, {
        startTime: 'asc'
      }]
    });
    // Build days array indexed 0..4 (Mon=1..Fri=5 in DB)
    const days = [[], [], [], [], []];
    for (const e of entries) {
      const dayIndex = e.dayOfWeek - 1; // 1-based → 0-based
      if (dayIndex < 0 || dayIndex > 4) {
        continue;
      }
      let teacherName = null;
      if (e.teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
          where: {
            id: e.teacherId
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });
        if (teacher) {
          teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`;
        }
      }
      days[dayIndex].push({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subjectId ?? null,
        teacherId: e.teacherId ?? null,
        teacherName,
        room: e.room ?? null,
        classId: e.classId
      });
    }
    await this.cache.set(cacheKey, JSON.stringify(days), 120);
    return days;
  }
  /** Get timetable for a teacher — all their classes */
  async getTeacherTimetable(teacherId) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher not found');
    }
    const entries = await this.prisma.timetable.findMany({
      where: {
        teacherId
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        }
      },
      orderBy: [{
        dayOfWeek: 'asc'
      }, {
        startTime: 'asc'
      }]
    });
    const slots = entries.map(e => ({
      id: e.id,
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      subject: e.subjectId ?? null,
      teacherId: e.teacherId ?? null,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      room: e.room ?? null,
      classId: e.classId,
      className: e.class.name,
      classGrade: e.class.grade
    }));
    return {
      teacherId,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      slots
    };
  }
  /** Create or update a timetable slot */
  async upsertSlot(dto) {
    let entry;
    if (dto.id) {
      const existing = await this.prisma.timetable.findUnique({
        where: {
          id: dto.id
        }
      });
      if (!existing) {
        throw new _common.NotFoundException('Timetable slot not found');
      }
      entry = await this.prisma.timetable.update({
        where: {
          id: dto.id
        },
        data: {
          dayOfWeek: dto.dayOfWeek,
          startTime: dto.startTime,
          endTime: dto.endTime,
          subjectId: dto.subjectId ?? null,
          teacherId: dto.teacherId ?? null,
          room: dto.room ?? null
        }
      });
    } else {
      entry = await this.prisma.timetable.create({
        data: {
          classId: dto.classId,
          dayOfWeek: dto.dayOfWeek,
          startTime: dto.startTime,
          endTime: dto.endTime,
          subjectId: dto.subjectId ?? null,
          teacherId: dto.teacherId ?? null,
          room: dto.room ?? null
        }
      });
    }
    // Invalidate cache
    await this.cache.del(`timetable:class:${dto.classId}`);
    let teacherName = null;
    if (entry.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          id: entry.teacherId
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      if (teacher) {
        teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`;
      }
    }
    return {
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subject: entry.subjectId ?? null,
      teacherId: entry.teacherId ?? null,
      teacherName,
      room: entry.room ?? null,
      classId: entry.classId
    };
  }
  /** Delete a slot */
  async deleteSlot(slotId) {
    const entry = await this.prisma.timetable.findUnique({
      where: {
        id: slotId
      }
    });
    if (!entry) {
      throw new _common.NotFoundException('Timetable slot not found');
    }
    await this.prisma.timetable.delete({
      where: {
        id: slotId
      }
    });
    await this.cache.del(`timetable:class:${entry.classId}`);
  }
  /** Detect conflicts: same teacher or same room at overlapping times on same day */
  async detectConflicts(tenantId) {
    // Load all timetable entries for this tenant's schools
    const schools = await this.prisma.school.findMany({
      where: {
        tenantId
      },
      select: {
        id: true
      }
    });
    const schoolIds = schools.map(s => s.id);
    const classes = await this.prisma.schoolClass.findMany({
      where: {
        schoolId: {
          in: schoolIds
        }
      },
      select: {
        id: true,
        name: true,
        grade: true
      }
    });
    const classIds = classes.map(c => c.id);
    const classMap = new Map(classes.map(c => [c.id, c]));
    const entries = await this.prisma.timetable.findMany({
      where: {
        classId: {
          in: classIds
        }
      },
      orderBy: [{
        dayOfWeek: 'asc'
      }, {
        startTime: 'asc'
      }]
    });
    const conflicts = [];
    // Group by (teacherId, day) and (room, day)
    const byTeacherDay = new Map();
    const byRoomDay = new Map();
    for (const e of entries) {
      if (e.teacherId) {
        const key = `${e.teacherId}:${e.dayOfWeek}`;
        if (!byTeacherDay.has(key)) {
          byTeacherDay.set(key, []);
        }
        byTeacherDay.get(key).push(e);
      }
      if (e.room) {
        const key = `${e.room}:${e.dayOfWeek}`;
        if (!byRoomDay.has(key)) {
          byRoomDay.set(key, []);
        }
        byRoomDay.get(key).push(e);
      }
    }
    // Check teacher conflicts
    for (const [key, slots] of byTeacherDay) {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
            const teacherId = a.teacherId;
            let teacherName;
            if (teacherId) {
              const teacher = await this.prisma.teacher.findUnique({
                where: {
                  id: teacherId
                },
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              });
              if (teacher) {
                teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`;
              }
            }
            conflicts.push({
              type: 'TEACHER',
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
              teacherId,
              teacherName,
              conflictingSlots: [{
                id: a.id,
                classId: a.classId,
                className: classMap.get(a.classId)?.name ?? ''
              }, {
                id: b.id,
                classId: b.classId,
                className: classMap.get(b.classId)?.name ?? ''
              }]
            });
          }
        }
      }
    }
    // Check room conflicts
    for (const [, slots] of byRoomDay) {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          if (a.classId !== b.classId && timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
            conflicts.push({
              type: 'ROOM',
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
              room: a.room ?? undefined,
              conflictingSlots: [{
                id: a.id,
                classId: a.classId,
                className: classMap.get(a.classId)?.name ?? ''
              }, {
                id: b.id,
                classId: b.classId,
                className: classMap.get(b.classId)?.name ?? ''
              }]
            });
          }
        }
      }
    }
    return conflicts;
  }
};
exports.TimetableService = TimetableService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], TimetableService);