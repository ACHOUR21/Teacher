"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComplianceService = void 0;
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
var ComplianceService_1;
const COPPA_MIN_AGE = 13;
let ComplianceService = exports.ComplianceService = ComplianceService_1 = class ComplianceService {
  logger = new _common.Logger(ComplianceService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  // COPPA: Verify user is old enough or has parental consent
  async checkCoppaCompliance(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        dateOfBirth: true,
        parentalConsent: true,
        tenantId: true
      }
    });
    if (!user) {
      return;
    }
    if (!user.dateOfBirth) {
      return;
    } // No DOB = skip COPPA check
    const age = this.calculateAge(user.dateOfBirth);
    if (age < COPPA_MIN_AGE && !user.parentalConsent) {
      throw new _common.ForbiddenException('Users under 13 require parental consent to access this platform (COPPA)');
    }
  }
  // FERPA: Verify requesting user has right to access student record
  async checkFerpaAccess(requestingUserId, studentId, tenantId) {
    const requester = await this.prisma.user.findUnique({
      where: {
        id: requestingUserId
      },
      select: {
        role: true,
        tenantId: true
      }
    });
    if (!requester) {
      throw new _common.ForbiddenException('Access denied');
    }
    // Student can always access their own records
    if (requestingUserId === studentId) {
      return;
    }
    // Must be in same tenant
    if (requester.tenantId !== tenantId) {
      throw new _common.ForbiddenException('FERPA: Cross-tenant access to student records is prohibited');
    }
    const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(requester.role)) {
      throw new _common.ForbiddenException('FERPA: Insufficient permissions to access student records');
    }
    // Check if there's a directory restriction for this student
    const student = await this.prisma.user.findUnique({
      where: {
        id: studentId
      },
      select: {
        directoryRestriction: true
      }
    });
    if (student?.directoryRestriction && requester.role === 'TEACHER') {
      this.logger.warn(`FERPA: Directory restriction active for student ${studentId}`);
    }
  }
  // Grant parental consent for a minor
  async grantParentalConsent(minorUserId, parentEmail,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _consentToken) {
    // Validate consent token (simplified — in production use signed tokens)
    await this.prisma.user.update({
      where: {
        id: minorUserId
      },
      data: {
        parentalConsent: true,
        parentEmail
      }
    });
    this.logger.log(`Parental consent granted for user ${minorUserId} by ${parentEmail}`);
  }
  // Get COPPA consent status for a user
  async getCoppaStatus(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        dateOfBirth: true,
        parentalConsent: true,
        parentEmail: true
      }
    });
    if (!user) {
      return null;
    }
    const age = user.dateOfBirth ? this.calculateAge(user.dateOfBirth) : null;
    return {
      requiresParentalConsent: age !== null && age < COPPA_MIN_AGE,
      parentalConsentGranted: user.parentalConsent ?? false,
      parentEmail: user.parentEmail,
      age
    };
  }
  // FERPA: Set directory restriction for a student
  async setDirectoryRestriction(studentId, restricted) {
    await this.prisma.user.update({
      where: {
        id: studentId
      },
      data: {
        directoryRestriction: restricted
      }
    });
    this.logger.log(`FERPA directory restriction ${restricted ? 'enabled' : 'disabled'} for user ${studentId}`);
  }
  // FERPA: List audit log entries related to student record access
  async getFerpaAuditLog(tenantId, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        OR: [{
          resource: 'student'
        }, {
          resource: 'grades'
        }, {
          resource: 'enrollment'
        }, {
          resource: 'user-record'
        }],
        action: 'VIEW'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        createdAt: true
      }
    });
  }
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) {
      age--;
    }
    return age;
  }
};
exports.ComplianceService = ComplianceService = ComplianceService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], ComplianceService);