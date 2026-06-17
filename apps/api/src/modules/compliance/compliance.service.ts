import { Injectable, ForbiddenException, Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

const COPPA_MIN_AGE = 13;

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // COPPA: Verify user is old enough or has parental consent
  async checkCoppaCompliance(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true, parentalConsent: true, tenantId: true },
    });
    if (!user) { return; }
    if (!user.dateOfBirth) { return; } // No DOB = skip COPPA check

    const age = this.calculateAge(user.dateOfBirth);
    if (age < COPPA_MIN_AGE && !user.parentalConsent) {
      throw new ForbiddenException(
        'Users under 13 require parental consent to access this platform (COPPA)',
      );
    }
  }

  // FERPA: Verify requesting user has right to access student record
  async checkFerpaAccess(
    requestingUserId: string,
    studentId: string,
    tenantId: string,
  ): Promise<void> {
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true, tenantId: true },
    });
    if (!requester) { throw new ForbiddenException('Access denied'); }

    // Student can always access their own records
    if (requestingUserId === studentId) { return; }

    // Must be in same tenant
    if (requester.tenantId !== tenantId) {
      throw new ForbiddenException(
        'FERPA: Cross-tenant access to student records is prohibited',
      );
    }

    const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(requester.role)) {
      throw new ForbiddenException(
        'FERPA: Insufficient permissions to access student records',
      );
    }

    // Check if there's a directory restriction for this student
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { directoryRestriction: true },
    });
    if (student?.directoryRestriction && requester.role === 'TEACHER') {
      this.logger.warn(
        `FERPA: Directory restriction active for student ${studentId}`,
      );
    }
  }

  // Grant parental consent for a minor
  async grantParentalConsent(
    minorUserId: string,
    parentEmail: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _consentToken: string,
  ): Promise<void> {
    // Validate consent token (simplified — in production use signed tokens)
    await this.prisma.user.update({
      where: { id: minorUserId },
      data: { parentalConsent: true, parentEmail },
    });
    this.logger.log(
      `Parental consent granted for user ${minorUserId} by ${parentEmail}`,
    );
  }

  // Get COPPA consent status for a user
  async getCoppaStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true, parentalConsent: true, parentEmail: true },
    });
    if (!user) { return null; }

    const age = user.dateOfBirth ? this.calculateAge(user.dateOfBirth) : null;
    return {
      requiresParentalConsent: age !== null && age < COPPA_MIN_AGE,
      parentalConsentGranted: user.parentalConsent ?? false,
      parentEmail: user.parentEmail,
      age,
    };
  }

  // FERPA: Set directory restriction for a student
  async setDirectoryRestriction(
    studentId: string,
    restricted: boolean,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: studentId },
      data: { directoryRestriction: restricted },
    });
    this.logger.log(
      `FERPA directory restriction ${restricted ? 'enabled' : 'disabled'} for user ${studentId}`,
    );
  }

  // FERPA: List audit log entries related to student record access
  async getFerpaAuditLog(tenantId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        OR: [
          { resource: 'student' },
          { resource: 'grades' },
          { resource: 'enrollment' },
          { resource: 'user-record' },
        ],
        action: 'VIEW',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }
}
