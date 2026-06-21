"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParentPortalService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _notifications = require("../notifications/notifications.service");
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
// ─── Service ──────────────────────────────────────────────────────────────────
let ParentPortalService = exports.ParentPortalService = class ParentPortalService {
  constructor(prisma, notifications) {
    this.prisma = prisma;
    this.notifications = notifications;
  }
  // ── Children list ───────────────────────────────────────────────────────────
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
                    grade: true
                  }
                },
                courseProgress: {
                  select: {
                    progressPercent: true,
                    completedAt: true
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
    return parent.children.map(({
      student
    }) => {
      const progressItems = student.courseProgress;
      const activeCourses = progressItems.filter(p => !p.completedAt).length;
      const completionRate = progressItems.length > 0 ? Math.round(progressItems.reduce((sum, p) => sum + p.progressPercent, 0) / progressItems.length) : 0;
      return {
        userId: student.userId,
        studentId: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        avatarUrl: student.user.avatarUrl,
        grade: student.grade ?? student.class?.grade,
        school: student.school?.name,
        activeCourses,
        completionRate,
        currentStreak: 0 // Streak from points if available
      };
    });
  }
  // ── Child academic overview ─────────────────────────────────────────────────
  async getChildOverview(parentUserId, childUserId) {
    const student = await this.verifyParentChild(parentUserId, childUserId);
    const [progressList, gradeList, attendanceCount, totalAttendance, aiSessions] = await Promise.all([this.prisma.courseProgress.findMany({
      where: {
        studentId: student.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      },
      take: 10
    }), this.prisma.submission.findMany({
      where: {
        studentId: student.id,
        status: 'GRADED',
        gradedAt: {
          not: null
        },
        score: {
          not: null
        }
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true
          }
        }
      },
      orderBy: {
        gradedAt: 'desc'
      },
      take: 10
    }), this.prisma.attendance.count({
      where: {
        studentId: student.id,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        status: 'PRESENT'
      }
    }), this.prisma.attendance.count({
      where: {
        studentId: student.id,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }), this.prisma.aIConversation.count({
      where: {
        userId: childUserId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })]);
    const attendanceRate = totalAttendance > 0 ? Math.round(attendanceCount / totalAttendance * 100) : 100;
    const activeCourses = progressList.filter(p => !p.completedAt).length;
    const completionRate = progressList.length > 0 ? Math.round(progressList.reduce((s, p) => s + p.progressPercent, 0) / progressList.length) : 0;
    const childSummary = {
      userId: student.userId,
      studentId: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      avatarUrl: student.user.avatarUrl,
      grade: student.grade,
      school: student.school?.name,
      activeCourses,
      completionRate,
      currentStreak: 0
    };
    return {
      child: childSummary,
      courses: progressList.map(p => ({
        courseId: p.courseId,
        title: p.course.title,
        progress: p.progressPercent,
        lastAccessedAt: p.lastAccessedAt
      })),
      recentGrades: gradeList.filter(s => s.score !== null && s.gradedAt !== null).map(s => ({
        assignmentTitle: s.assignment.title,
        score: s.score,
        maxScore: s.assignment.maxScore,
        gradedAt: s.gradedAt
      })),
      weeklyStudyMinutes: 0,
      // Placeholder — requires lesson duration tracking
      attendanceRate,
      aiUsageSessions: aiSessions
    };
  }
  // ── Child attendance ────────────────────────────────────────────────────────
  async getChildAttendance(parentUserId, childUserId, month) {
    const student = await this.verifyParentChild(parentUserId, childUserId);
    const startDate = month ? new Date(month.getFullYear(), month.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    const records = await this.prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        class: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    return records.map(r => ({
      date: r.date,
      status: r.status,
      note: r.note,
      className: r.class.name
    }));
  }
  // ── Child assignments ───────────────────────────────────────────────────────
  async getChildAssignments(parentUserId, childUserId) {
    const student = await this.verifyParentChild(parentUserId, childUserId);
    const submissions = await this.prisma.submission.findMany({
      where: {
        studentId: student.id
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
    return submissions.map(s => ({
      assignmentId: s.assignmentId,
      title: s.assignment.title,
      maxScore: s.assignment.maxScore,
      score: s.score,
      status: s.status,
      submittedAt: s.submittedAt,
      gradedAt: s.gradedAt,
      dueDate: s.assignment.dueDate
    }));
  }
  // ── Child upcoming events ───────────────────────────────────────────────────
  async getChildUpcomingEvents(parentUserId, childUserId) {
    const student = await this.verifyParentChild(parentUserId, childUserId);
    const now = new Date();
    const [liveSessions, assignments] = await Promise.all([this.prisma.liveParticipant.findMany({
      where: {
        userId: childUserId,
        session: {
          scheduledAt: {
            gte: now
          },
          status: 'SCHEDULED'
        }
      },
      include: {
        session: {
          select: {
            title: true,
            scheduledAt: true
          }
        }
      },
      orderBy: {
        session: {
          scheduledAt: 'asc'
        }
      },
      take: 5
    }), this.prisma.submission.findMany({
      where: {
        studentId: student.id,
        status: {
          not: 'GRADED'
        },
        assignment: {
          dueDate: {
            gte: now
          }
        }
      },
      include: {
        assignment: {
          select: {
            title: true,
            dueDate: true
          }
        }
      },
      orderBy: {
        assignment: {
          dueDate: 'asc'
        }
      },
      take: 5
    })]);
    const events = [...liveSessions.map(lp => ({
      type: 'LIVE_SESSION',
      title: lp.session.title,
      scheduledAt: lp.session.scheduledAt
    })), ...assignments.filter(s => s.assignment.dueDate).map(s => ({
      type: 'ASSIGNMENT_DUE',
      title: s.assignment.title,
      scheduledAt: s.assignment.dueDate
    }))];
    return events.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).slice(0, 10);
  }
  // ── Messaging teachers ──────────────────────────────────────────────────────
  async messageTeacher(parentUserId, teacherUserId, subject, message) {
    // Verify teacher exists
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherUserId
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher not found');
    }
    // Find or create conversation between parent and teacher
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        participants: {
          every: {
            userId: {
              in: [parentUserId, teacherUserId]
            }
          }
        }
      },
      include: {
        participants: true
      }
    });
    let conversationId;
    if (existing && existing.participants.length === 2) {
      conversationId = existing.id;
    } else {
      const convo = await this.prisma.conversation.create({
        data: {
          type: 'direct',
          name: subject,
          participants: {
            create: [{
              userId: parentUserId
            }, {
              userId: teacherUserId
            }]
          }
        }
      });
      conversationId = convo.id;
    }
    await this.prisma.message.create({
      data: {
        conversationId,
        senderId: parentUserId,
        content: message
      }
    });
    // Notify teacher (non-blocking)
    this.notifications.notifyUser(teacherUserId, `New message: ${subject}`, message, {
      type: 'MESSAGE',
      href: '/messages'
    }).catch(() => null);
  }
  // ── Conversations ───────────────────────────────────────────────────────────
  async getConversations(parentUserId) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId: parentUserId
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true
                  }
                }
              }
            },
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });
    return participations.map(p => {
      const convo = p.conversation;
      const lastMsg = convo.messages[0] ?? null;
      const others = convo.participants.filter(cp => cp.userId !== parentUserId);
      return {
        conversationId: convo.id,
        participants: others.map(cp => ({
          userId: cp.user.id,
          firstName: cp.user.firstName,
          lastName: cp.user.lastName,
          avatarUrl: cp.user.avatarUrl
        })),
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
        unreadCount: convo.messages.filter(m => !m.isRead && m.senderId !== parentUserId).length
      };
    });
  }
  // ── Link child by email ─────────────────────────────────────────────────────
  async linkChildByEmail(parentUserId, childEmail) {
    // Get parent profile (or create one)
    let parent = await this.prisma.parent.findUnique({
      where: {
        userId: parentUserId
      }
    });
    if (!parent) {
      parent = await this.prisma.parent.create({
        data: {
          userId: parentUserId
        }
      });
    }
    // Find parent's tenant
    const parentUser = await this.prisma.user.findUnique({
      where: {
        id: parentUserId
      }
    });
    if (!parentUser) {
      throw new _common.NotFoundException('Parent user not found');
    }
    // Find child user in same tenant
    const childUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: parentUser.tenantId,
          email: childEmail
        }
      }
    });
    if (!childUser) {
      throw new _common.NotFoundException('No student found with that email in your organization');
    }
    // Find student profile
    const student = await this.prisma.student.findUnique({
      where: {
        userId: childUser.id
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile not found for that email');
    }
    await this.prisma.parentStudent.upsert({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId: student.id
        }
      },
      update: {},
      create: {
        parentId: parent.id,
        studentId: student.id,
        relationship: 'parent'
      }
    });
  }
  // ── Private helper ──────────────────────────────────────────────────────────
  async verifyParentChild(parentUserId, childUserId) {
    const parent = await this.prisma.parent.findUnique({
      where: {
        userId: parentUserId
      }
    });
    if (!parent) {
      throw new _common.ForbiddenException('Not a parent');
    }
    const student = await this.prisma.student.findUnique({
      where: {
        userId: childUserId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        school: {
          select: {
            name: true
          }
        }
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId: student.id
        }
      }
    });
    if (!link) {
      throw new _common.ForbiddenException('You are not linked to this student');
    }
    return student;
  }
};
exports.ParentPortalService = ParentPortalService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], ParentPortalService);