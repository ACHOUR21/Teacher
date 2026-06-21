"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UniversityErpService = void 0;
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
let UniversityErpService = exports.UniversityErpService = class UniversityErpService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async createUniversity(tenantId, dto) {
    return this.prisma.university.create({
      data: {
        tenantId,
        ...dto
      }
    });
  }
  async getUniversities(tenantId) {
    return this.prisma.university.findMany({
      where: {
        tenantId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            faculties: true,
            programs: true
          }
        }
      }
    });
  }
  async getUniversity(id) {
    const university = await this.prisma.university.findUnique({
      where: {
        id
      },
      include: {
        _count: {
          select: {
            faculties: true,
            programs: true
          }
        }
      }
    });
    if (!university) {
      throw new _common.NotFoundException('University not found');
    }
    const enrollmentsCount = await this.prisma.enrollment.count({
      where: {
        program: {
          universityId: id
        }
      }
    });
    const activeStudents = await this.prisma.enrollment.count({
      where: {
        program: {
          universityId: id
        },
        status: _client.EnrollmentStatus.ACTIVE
      }
    });
    return {
      ...university,
      enrollmentsCount,
      activeStudents
    };
  }
  async updateUniversity(id, dto) {
    const existing = await this.prisma.university.findUnique({
      where: {
        id
      }
    });
    if (!existing) {
      throw new _common.NotFoundException('University not found');
    }
    return this.prisma.university.update({
      where: {
        id
      },
      data: dto
    });
  }
  async getFaculties(universityId) {
    return this.prisma.faculty.findMany({
      where: {
        universityId
      },
      include: {
        _count: {
          select: {
            departments: true
          }
        }
      }
    });
  }
  async createFaculty(universityId, dto) {
    return this.prisma.faculty.create({
      data: {
        universityId,
        ...dto
      }
    });
  }
  async deleteFaculty(id) {
    const existing = await this.prisma.faculty.findUnique({
      where: {
        id
      }
    });
    if (!existing) {
      throw new _common.NotFoundException('Faculty not found');
    }
    return this.prisma.faculty.delete({
      where: {
        id
      }
    });
  }
  async createUniDepartment(facultyId, dto) {
    return this.prisma.uniDepartment.create({
      data: {
        facultyId,
        name: dto.name
      }
    });
  }
  async getDepartments(facultyId) {
    return this.prisma.uniDepartment.findMany({
      where: {
        facultyId
      },
      include: {
        _count: {
          select: {
            programs: true
          }
        }
      }
    });
  }
  async createProgram(universityId, dto) {
    return this.prisma.academicProgram.create({
      data: {
        universityId,
        ...dto
      }
    });
  }
  async getPrograms(universityId) {
    return this.prisma.academicProgram.findMany({
      where: {
        universityId
      },
      include: {
        department: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });
  }
  async getProgramEnrollmentStats(programId) {
    const [active, completed, suspended, withdrawn] = await Promise.all([this.prisma.enrollment.count({
      where: {
        programId,
        status: _client.EnrollmentStatus.ACTIVE
      }
    }), this.prisma.enrollment.count({
      where: {
        programId,
        status: _client.EnrollmentStatus.COMPLETED
      }
    }), this.prisma.enrollment.count({
      where: {
        programId,
        status: _client.EnrollmentStatus.SUSPENDED
      }
    }), this.prisma.enrollment.count({
      where: {
        programId,
        status: _client.EnrollmentStatus.WITHDRAWN
      }
    })]);
    return {
      active,
      completed,
      suspended,
      withdrawn,
      total: active + completed + suspended + withdrawn
    };
  }
  async enrollStudent(studentId, programId) {
    return this.prisma.enrollment.create({
      data: {
        studentId,
        programId,
        status: _client.EnrollmentStatus.ACTIVE
      }
    });
  }
  async getEnrollments(programId) {
    return this.prisma.enrollment.findMany({
      where: {
        programId
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
  }
  async updateEnrollmentStatus(id, status) {
    return this.prisma.enrollment.update({
      where: {
        id
      },
      data: {
        status,
        ...(status === _client.EnrollmentStatus.COMPLETED ? {
          completedAt: new Date()
        } : {})
      }
    });
  }
  async getStudentAcademicRecord(studentId, universityId) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: {
          where: {
            program: {
              universityId
            }
          },
          include: {
            program: {
              select: {
                name: true,
                code: true,
                degree: true,
                durationYears: true
              }
            }
          }
        }
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    return student;
  }
  async getStudentGPA(studentId) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      select: {
        gpa: true
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    return {
      gpa: student.gpa
    };
  }
};
exports.UniversityErpService = UniversityErpService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], UniversityErpService);