"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SubmitAssignmentDto = exports.GradeSubmissionDto = exports.CreateAssignmentDto = exports.AssignmentsService = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
var _apiEcosystem = require("../api-ecosystem/api-ecosystem.service");
var _prisma = require("../database/prisma.service");
var _notifications = require("../notifications/notifications.service");
var _parentNotifications = require("../notifications/parent-notifications.service");
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
class CreateAssignmentDto {
  title;
  description;
  lessonId;
  dueDate;
  maxScore;
  attachments;
}
exports.CreateAssignmentDto = CreateAssignmentDto;
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateAssignmentDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateAssignmentDto.prototype, "description", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateAssignmentDto.prototype, "lessonId", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateAssignmentDto.prototype, "dueDate", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), __metadata("design:type", Number)], CreateAssignmentDto.prototype, "maxScore", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], CreateAssignmentDto.prototype, "attachments", void 0);
class SubmitAssignmentDto {
  content;
  attachments;
}
exports.SubmitAssignmentDto = SubmitAssignmentDto;
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SubmitAssignmentDto.prototype, "content", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], SubmitAssignmentDto.prototype, "attachments", void 0);
class GradeSubmissionDto {
  score;
  feedback;
}
exports.GradeSubmissionDto = GradeSubmissionDto;
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(0), (0, _classValidator.Max)(100), __metadata("design:type", Number)], GradeSubmissionDto.prototype, "score", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], GradeSubmissionDto.prototype, "feedback", void 0);
let AssignmentsService = exports.AssignmentsService = class AssignmentsService {
  constructor(prisma, notifications, apiEcosystem, parentNotifications) {
    this.prisma = prisma;
    this.notifications = notifications;
    this.apiEcosystem = apiEcosystem;
    this.parentNotifications = parentNotifications;
  }
  async create(teacherId, dto) {
    const assignment = await this.prisma.assignment.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        lessonId: dto.lessonId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxScore: dto.maxScore ?? 100,
        attachments: dto.attachments ?? []
      }
    });
    // fire-and-forget notification to enrolled students
    if (dto.lessonId) {
      this.prisma.courseProgress.findMany({
        where: {
          course: {
            sections: {
              some: {
                lessons: {
                  some: {
                    id: dto.lessonId
                  }
                }
              }
            }
          }
        },
        include: {
          student: {
            select: {
              userId: true
            }
          }
        }
      }).then(async enrollments => {
        for (const e of enrollments) {
          if (e.student?.userId) {
            await this.notifications.notifyUser(e.student.userId, 'New Assignment', `A new assignment "${dto.title}" has been posted`, {
              type: 'ASSIGNMENT_DUE',
              assignmentId: assignment.id
            }).catch(() => {});
          }
        }
      }).catch(() => {});
    }
    return assignment;
  }
  async findAll(teacherId, studentId, lessonId) {
    const where = {};
    if (teacherId) {
      where.teacherId = teacherId;
    }
    if (lessonId) {
      where.lessonId = lessonId;
    }
    const assignments = await this.prisma.assignment.findMany({
      where,
      include: {
        _count: {
          select: {
            submissions: true
          }
        },
        ...(studentId && {
          submissions: {
            where: {
              studentId
            },
            select: {
              id: true,
              status: true,
              score: true,
              submittedAt: true
            }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return assignments;
  }
  async findById(id) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });
    if (!assignment) {
      throw new _common.NotFoundException('Assignment not found');
    }
    return assignment;
  }
  async update(id, teacherId, dto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id
      }
    });
    if (!assignment) {
      throw new _common.NotFoundException('Assignment not found');
    }
    if (assignment.teacherId !== teacherId) {
      throw new _common.ForbiddenException('Not your assignment');
    }
    return this.prisma.assignment.update({
      where: {
        id
      },
      data: {
        ...(dto.title && {
          title: dto.title
        }),
        ...(dto.description !== undefined && {
          description: dto.description
        }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null
        }),
        ...(dto.maxScore !== undefined && {
          maxScore: dto.maxScore
        }),
        ...(dto.attachments && {
          attachments: dto.attachments
        })
      }
    });
  }
  async delete(id, teacherId) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id
      }
    });
    if (!assignment) {
      throw new _common.NotFoundException('Assignment not found');
    }
    if (assignment.teacherId !== teacherId) {
      throw new _common.ForbiddenException('Not your assignment');
    }
    await this.prisma.assignment.delete({
      where: {
        id
      }
    });
  }
  async submit(assignmentId, studentId, dto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: assignmentId
      }
    });
    if (!assignment) {
      throw new _common.NotFoundException('Assignment not found');
    }
    let status;
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      const existing = await this.prisma.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId
          }
        }
      });
      if (existing) {
        throw new _common.ConflictException('Already submitted');
      }
      status = _client.AssignmentStatus.LATE;
    } else {
      const existing = await this.prisma.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId
          }
        }
      });
      if (existing) {
        throw new _common.ConflictException('Already submitted');
      }
      status = _client.AssignmentStatus.SUBMITTED;
    }
    const submission = await this.prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        content: dto.content,
        attachments: dto.attachments ?? [],
        status,
        submittedAt: new Date()
      }
    });
    // Fire-and-forget webhook
    this.prisma.teacher.findUnique({
      where: {
        id: assignment.teacherId ?? ''
      },
      include: {
        user: {
          select: {
            tenantId: true
          }
        }
      }
    }).then(teacher => {
      const tenantId = teacher?.user?.tenantId ?? '';
      if (tenantId) {
        this.apiEcosystem.deliverWebhook(tenantId, 'assignment.submitted', {
          assignmentId,
          studentId,
          status
        }).catch(() => {});
      }
    }).catch(() => {});
    return submission;
  }
  async getSubmissions(assignmentId, teacherId) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: assignmentId
      }
    });
    if (!assignment) {
      throw new _common.NotFoundException('Assignment not found');
    }
    if (assignment.teacherId !== teacherId) {
      throw new _common.ForbiddenException('Not your assignment');
    }
    return this.prisma.submission.findMany({
      where: {
        assignmentId
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
        submittedAt: 'asc'
      }
    });
  }
  async getMySubmission(assignmentId, studentId) {
    return this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });
  }
  async grade(submissionId, teacherId, dto) {
    const submission = await this.prisma.submission.findUnique({
      where: {
        id: submissionId
      },
      include: {
        assignment: true,
        student: {
          select: {
            userId: true
          }
        }
      }
    });
    if (!submission) {
      throw new _common.NotFoundException('Submission not found');
    }
    if (submission.assignment.teacherId !== teacherId) {
      throw new _common.ForbiddenException('Not your assignment');
    }
    if (dto.score < 0 || dto.score > submission.assignment.maxScore) {
      throw new _common.BadRequestException(`Score must be between 0 and ${submission.assignment.maxScore}`);
    }
    const result = await this.prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        status: _client.AssignmentStatus.GRADED,
        gradedAt: new Date()
      }
    });
    // notify the student
    const studentUserId = submission.student?.userId ?? (await this.prisma.student.findUnique({
      where: {
        id: submission.studentId
      },
      select: {
        userId: true
      }
    }))?.userId;
    if (studentUserId) {
      await this.notifications.notifyUser(studentUserId, 'Assignment Graded', `You scored ${dto.score}/${submission.assignment.maxScore} on "${submission.assignment.title}"`, {
        type: 'GRADE_PUBLISHED',
        assignmentId: submission.assignmentId
      });
    }
    // Notify linked parents (non-blocking)
    const studentRecord = await this.prisma.student.findUnique({
      where: {
        id: submission.studentId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }).catch(() => null);
    if (studentRecord) {
      this.parentNotifications.notifyParentsOfGradedSubmission({
        studentId: submission.studentId,
        studentFirstName: studentRecord.user.firstName,
        studentLastName: studentRecord.user.lastName,
        assignmentTitle: submission.assignment.title,
        score: dto.score,
        maxScore: submission.assignment.maxScore
      }).catch(() => null);
    }
    // Fire-and-forget webhook
    this.prisma.teacher.findUnique({
      where: {
        id: teacherId
      },
      include: {
        user: {
          select: {
            tenantId: true
          }
        }
      }
    }).then(teacher => {
      const tenantId = teacher?.user?.tenantId ?? '';
      if (tenantId) {
        this.apiEcosystem.deliverWebhook(tenantId, 'assignment.graded', {
          submissionId,
          score: dto.score,
          passed: dto.score >= submission.assignment.maxScore * 0.7
        }).catch(() => {});
      }
    }).catch(() => {});
    return result;
  }
  async getStudentAssignments(studentId) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const enrolledCourses = await this.prisma.courseProgress.findMany({
      where: {
        studentId
      },
      select: {
        courseId: true
      }
    });
    const courseIds = enrolledCourses.map(e => e.courseId);
    const assignments = await this.prisma.assignment.findMany({
      where: {
        OR: [{
          lesson: {
            section: {
              courseId: {
                in: courseIds
              }
            }
          }
        }, {
          teacherId: {
            not: null
          }
        }]
      },
      include: {
        submissions: {
          where: {
            studentId
          },
          select: {
            id: true,
            status: true,
            score: true,
            submittedAt: true,
            gradedAt: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    return assignments;
  }
};
exports.AssignmentsService = AssignmentsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __param(2, (0, _common.Inject)(_apiEcosystem.ApiEcosystemService)), __param(3, (0, _common.Inject)(_parentNotifications.ParentNotificationsService)), __metadata("design:paramtypes", [Object, Object, Object, Object])], AssignmentsService);