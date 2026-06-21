"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UniversityService = void 0;
var _common = require("@nestjs/common");
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
let UniversityService = exports.UniversityService = class UniversityService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  // ─── Departments ────────────────────────────────────────────────────────────
  async getDepartments(tenantId) {
    const departments = await this.prisma.uniCourseDepartment.findMany({
      where: {
        tenantId
      },
      include: {
        _count: {
          select: {
            faculty: true,
            courses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    return departments;
  }
  async createDepartment(tenantId, dto) {
    const existing = await this.prisma.uniCourseDepartment.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: dto.code
        }
      }
    });
    if (existing) {
      throw new _common.ConflictException(`Department with code '${dto.code}' already exists`);
    }
    return this.prisma.uniCourseDepartment.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        headFacultyId: dto.headFacultyId
      }
    });
  }
  // ─── Faculty Members ─────────────────────────────────────────────────────────
  async getFacultyMembers(tenantId, departmentId) {
    return this.prisma.facultyMember.findMany({
      where: {
        tenantId,
        ...(departmentId ? {
          departmentId
        } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  async createFacultyMember(tenantId, dto) {
    const existing = await this.prisma.facultyMember.findUnique({
      where: {
        userId: dto.userId
      }
    });
    if (existing) {
      throw new _common.ConflictException('User is already a faculty member');
    }
    return this.prisma.facultyMember.create({
      data: {
        tenantId,
        userId: dto.userId,
        departmentId: dto.departmentId,
        title: dto.title ?? 'Lecturer',
        specializations: dto.specializations ?? []
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }
  // ─── Courses ─────────────────────────────────────────────────────────────────
  async getUniversityCourses(tenantId, departmentId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...(departmentId ? {
        departmentId
      } : {})
    };
    const [courses, total] = await Promise.all([this.prisma.uniCourse.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    }), this.prisma.uniCourse.count({
      where
    })]);
    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  // ─── Enrollment ──────────────────────────────────────────────────────────────
  async enrollStudent(tenantId, studentId, courseId, semesterId) {
    // Conflict detection: already enrolled and active
    const existing = await this.prisma.universityEnrollment.findFirst({
      where: {
        studentId,
        courseId,
        semesterId,
        status: 'ACTIVE'
      }
    });
    if (existing) {
      throw new _common.ConflictException('Student is already enrolled in this course for this semester');
    }
    // Check if a dropped enrollment exists — allow re-enroll
    const dropped = await this.prisma.universityEnrollment.findFirst({
      where: {
        studentId,
        courseId,
        semesterId,
        status: 'DROPPED'
      }
    });
    if (dropped) {
      return this.prisma.universityEnrollment.update({
        where: {
          id: dropped.id
        },
        data: {
          status: 'ACTIVE',
          enrolledAt: new Date()
        }
      });
    }
    const enrollment = await this.prisma.universityEnrollment.create({
      data: {
        tenantId,
        studentId,
        courseId,
        semesterId,
        status: 'ACTIVE'
      }
    });
    // Increment enrollCount on course
    await this.prisma.uniCourse.update({
      where: {
        id: courseId
      },
      data: {
        enrollCount: {
          increment: 1
        }
      }
    });
    return enrollment;
  }
  async dropCourse(tenantId, studentId, courseId) {
    const enrollment = await this.prisma.universityEnrollment.findFirst({
      where: {
        tenantId,
        studentId,
        courseId,
        status: 'ACTIVE'
      }
    });
    if (!enrollment) {
      throw new _common.NotFoundException('Active enrollment not found');
    }
    const updated = await this.prisma.universityEnrollment.update({
      where: {
        id: enrollment.id
      },
      data: {
        status: 'DROPPED'
      }
    });
    // Decrement enrollCount
    await this.prisma.uniCourse.update({
      where: {
        id: courseId
      },
      data: {
        enrollCount: {
          decrement: 1
        }
      }
    });
    return updated;
  }
  // ─── Transcript ──────────────────────────────────────────────────────────────
  async getTranscript(tenantId, studentId) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const enrollments = await this.prisma.universityEnrollment.findMany({
      where: {
        tenantId,
        studentId,
        status: 'COMPLETED'
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            credits: true,
            departmentId: true
          }
        },
        semester: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'asc'
      }
    });
    const grades = enrollments.map(e => e.grade).filter(g => g !== null && g !== undefined);
    const gpa = this.calculateGpa(grades);
    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        gpa: student.gpa,
        user: student.user
      },
      enrollments,
      cumulativeGpa: gpa,
      totalCredits: enrollments.reduce((sum, e) => sum + (e.course?.credits ?? 0), 0),
      totalCourses: enrollments.length
    };
  }
  // ─── GPA Calculation ─────────────────────────────────────────────────────────
  calculateGpa(grades) {
    if (grades.length === 0) {
      return 0;
    }
    const gpaPoints = grades.map(score => {
      if (score >= 90) {
        return 4.0;
      } // A
      if (score >= 80) {
        return 3.0;
      } // B
      if (score >= 70) {
        return 2.0;
      } // C
      if (score >= 60) {
        return 1.0;
      } // D
      return 0.0; // F
    });
    const sum = gpaPoints.reduce((acc, p) => acc + p, 0);
    return Math.round(sum / gpaPoints.length * 100) / 100;
  }
  // ─── Semesters ───────────────────────────────────────────────────────────────
  async createSemester(tenantId, dto) {
    const existing = await this.prisma.semester.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: dto.name
        }
      }
    });
    if (existing) {
      throw new _common.ConflictException(`Semester '${dto.name}' already exists`);
    }
    // If this semester is active, deactivate others
    if (dto.isActive) {
      await this.prisma.semester.updateMany({
        where: {
          tenantId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    }
    return this.prisma.semester.create({
      data: {
        tenantId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? false
      }
    });
  }
  async getActiveSemester(tenantId) {
    const semester = await this.prisma.semester.findFirst({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });
    if (!semester) {
      throw new _common.NotFoundException('No active semester found');
    }
    return semester;
  }
  // ─── Dashboard Stats ─────────────────────────────────────────────────────────
  async getDashboardStats(tenantId) {
    const [departmentCount, facultyCount, enrolledStudents, activeSemester] = await Promise.all([this.prisma.uniCourseDepartment.count({
      where: {
        tenantId
      }
    }), this.prisma.facultyMember.count({
      where: {
        tenantId
      }
    }), this.prisma.universityEnrollment.count({
      where: {
        tenantId,
        status: 'ACTIVE'
      }
    }), this.prisma.semester.findFirst({
      where: {
        tenantId,
        isActive: true
      }
    }).catch(() => null)]);
    return {
      departmentCount,
      facultyCount,
      enrolledStudents,
      activeSemesterName: activeSemester?.name ?? null
    };
  }
};
exports.UniversityService = UniversityService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], UniversityService);