"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SchoolErpService = void 0;
var _common = require("@nestjs/common");
var _redis = require("../cache/redis.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-return */

let SchoolErpService = exports.SchoolErpService = class SchoolErpService {
  constructor(prisma, cache) {
    this.prisma = prisma;
    this.cache = cache;
  }
  async createSchool(tenantId, dto) {
    const school = await this.prisma.school.create({
      data: {
        tenantId,
        ...dto
      }
    });
    await this.cache.del(`school-erp:${tenantId}:schools`);
    return school;
  }
  async getSchools(tenantId) {
    const cacheKey = `school-erp:${tenantId}:schools`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const schools = await this.prisma.school.findMany({
      where: {
        tenantId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            departments: true,
            classes: true,
            teachers: true,
            students: true
          }
        }
      }
    });
    await this.cache.set(cacheKey, JSON.stringify(schools), 60);
    return schools;
  }
  async getSchool(id) {
    const school = await this.prisma.school.findUnique({
      where: {
        id
      },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                classes: true
              }
            }
          }
        },
        classes: {
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        },
        _count: {
          select: {
            teachers: true,
            students: true
          }
        }
      }
    });
    if (!school) {
      throw new _common.NotFoundException('School not found');
    }
    return school;
  }
  async createDepartment(schoolId, dto) {
    return this.prisma.department.create({
      data: {
        schoolId,
        ...dto
      }
    });
  }
  async getDepartments(schoolId) {
    return this.prisma.department.findMany({
      where: {
        schoolId
      },
      include: {
        _count: {
          select: {
            classes: true
          }
        }
      }
    });
  }
  async createClass(schoolId, dto) {
    const cls = await this.prisma.schoolClass.create({
      data: {
        schoolId,
        ...dto
      }
    });
    await this.cache.del(`school-erp:${schoolId}:classes`);
    return cls;
  }
  async getClasses(schoolId) {
    const cacheKey = `school-erp:${schoolId}:classes`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const classes = await this.prisma.schoolClass.findMany({
      where: {
        schoolId
      },
      include: {
        department: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });
    await this.cache.set(cacheKey, JSON.stringify(classes), 60);
    return classes;
  }
  async getTimetable(classId) {
    return this.prisma.timetable.findMany({
      where: {
        classId
      },
      orderBy: [{
        dayOfWeek: 'asc'
      }, {
        startTime: 'asc'
      }]
    });
  }
  async createTimetableEntry(classId, dto) {
    return this.prisma.timetable.create({
      data: {
        classId,
        ...dto
      }
    });
  }
  async deleteTimetableEntry(id) {
    const entry = await this.prisma.timetable.findUnique({
      where: {
        id
      }
    });
    if (!entry) {
      throw new _common.NotFoundException('Timetable entry not found');
    }
    return this.prisma.timetable.delete({
      where: {
        id
      }
    });
  }
  async getSchoolStats(schoolId) {
    const [totalStudents, totalTeachers, totalClasses, activeSessions] = await Promise.all([this.prisma.student.count({
      where: {
        schoolId
      }
    }), this.prisma.teacher.count({
      where: {
        schoolId
      }
    }), this.prisma.schoolClass.count({
      where: {
        schoolId
      }
    }), this.prisma.liveSession.count({
      where: {
        teacher: {
          schoolId
        },
        status: 'LIVE'
      }
    })]);
    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      activeSessions
    };
  }
  async assignStudentToClass(studentId, classId) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const updated = await this.prisma.student.update({
      where: {
        id: studentId
      },
      data: {
        classId
      }
    });
    // Invalidate both old and new class student lists
    await Promise.all([this.cache.del(`school-erp:${classId}:students`), student.classId ? this.cache.del(`school-erp:${student.classId}:students`) : Promise.resolve()]);
    return updated;
  }
  async removeStudentFromClass(studentId, classId) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        classId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found in this class');
    }
    const updated = await this.prisma.student.update({
      where: {
        id: studentId
      },
      data: {
        classId: null
      }
    });
    await this.cache.del(`school-erp:${classId}:students`);
    return updated;
  }
  async getClassStudents(classId) {
    const cacheKey = `school-erp:${classId}:students`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
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
            email: true,
            avatarUrl: true
          }
        }
      }
    });
    await this.cache.set(cacheKey, JSON.stringify(students), 60);
    return students;
  }
  async assignTeacherToSchool(teacherId, schoolId) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id: teacherId
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher not found');
    }
    const updated = await this.prisma.teacher.update({
      where: {
        id: teacherId
      },
      data: {
        schoolId
      }
    });
    await this.cache.del(`school-erp:${schoolId}:teachers`);
    return updated;
  }
  async getSchoolTeachers(schoolId) {
    const cacheKey = `school-erp:${schoolId}:teachers`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const teachers = await this.prisma.teacher.findMany({
      where: {
        schoolId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
    await this.cache.set(cacheKey, JSON.stringify(teachers), 60);
    return teachers;
  }
};
exports.SchoolErpService = SchoolErpService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], SchoolErpService);