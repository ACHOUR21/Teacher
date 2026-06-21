"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParentsService = void 0;
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
let ParentsService = exports.ParentsService = class ParentsService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async getChildren(parentUserId) {
    const parent = await this.prisma.parent.findUnique({
      where: {
        userId: parentUserId
      },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true
                  }
                },
                school: {
                  select: {
                    name: true
                  }
                },
                class: {
                  select: {
                    name: true,
                    grade: true
                  }
                },
                _count: {
                  select: {
                    courseProgress: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!parent) {
      throw new _common.NotFoundException('Parent profile not found');
    }
    return parent.children.map(c => c.student);
  }
  async getChildProgress(parentUserId, studentId) {
    await this.verifyParentAccess(parentUserId, studentId);
    return this.prisma.courseProgress.findMany({
      where: {
        studentId
      },
      include: {
        course: {
          select: {
            title: true,
            thumbnailUrl: true,
            totalLessons: true
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      }
    });
  }
  async getChildSubmissions(parentUserId, studentId) {
    await this.verifyParentAccess(parentUserId, studentId);
    return this.prisma.submission.findMany({
      where: {
        studentId
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            dueDate: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 30
    });
  }
  async getChildAttendance(parentUserId, studentId) {
    await this.verifyParentAccess(parentUserId, studentId);
    return this.prisma.liveParticipant.findMany({
      where: {
        userId: studentId
      },
      include: {
        session: {
          select: {
            title: true,
            scheduledAt: true,
            status: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      },
      take: 30
    });
  }
  async linkChild(parentUserId, studentId, relationship = 'parent') {
    const parent = await this.prisma.parent.findUnique({
      where: {
        userId: parentUserId
      }
    });
    if (!parent) {
      throw new _common.NotFoundException('Parent profile not found');
    }
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    return this.prisma.parentStudent.upsert({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId
        }
      },
      update: {
        relationship
      },
      create: {
        parentId: parent.id,
        studentId,
        relationship
      }
    });
  }
  async verifyParentAccess(parentUserId, studentId) {
    const parent = await this.prisma.parent.findUnique({
      where: {
        userId: parentUserId
      }
    });
    if (!parent) {
      throw new _common.ForbiddenException('Not a parent');
    }
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId
        }
      }
    });
    if (!link) {
      throw new _common.ForbiddenException('Not linked to this student');
    }
  }
};
exports.ParentsService = ParentsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], ParentsService);