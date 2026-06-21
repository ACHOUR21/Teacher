"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificateGeneratorService = void 0;
var _crypto = require("crypto");
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _pdfkit = _interopRequireDefault(require("pdfkit"));
var _prisma = require("../database/prisma.service");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
/**
 * CertificateGeneratorService
 *
 * Handles PDF generation, SHA-256 hash verification, and enrollment-based
 * certificate issuance.  Uses the existing IssuedCertificate + CertificateTemplate
 * Prisma models (the platform does not maintain a separate Certificate table).
 */
let CertificateGeneratorService = exports.CertificateGeneratorService = class CertificateGeneratorService {
  constructor(prisma, config) {
    this.prisma = prisma;
    this.config = config;
  }
  get appBaseUrl() {
    return this.config.get('APP_BASE_URL') ?? 'https://app.eduai.io';
  }
  // ── Generate ───────────────────────────────────────────────────────────────
  /**
   * Generate a certificate for a completed course progress record.
   * Uses CourseProgress.completedAt to confirm completion.
   */
  async generateCertificate(progressId, tenantId) {
    // Fetch progress + student + course
    const progress = await this.prisma.courseProgress.findUnique({
      where: {
        id: progressId
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        course: {
          include: {
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });
    if (!progress) {
      throw new _common.NotFoundException('Course progress record not found');
    }
    if (!progress.completedAt) {
      throw new _common.BadRequestException('Course has not been completed yet');
    }
    // Verify course belongs to tenant
    if (progress.course.tenantId !== tenantId) {
      throw new _common.NotFoundException('Course not found in this tenant');
    }
    const recipientName = `${progress.student.user.firstName} ${progress.student.user.lastName}`;
    const courseName = progress.course.title;
    const completionDate = progress.completedAt;
    const instructorName = progress.course.teacher ? `${progress.course.teacher.user.firstName} ${progress.course.teacher.user.lastName}` : 'EduAI Team';
    // Fetch tenant name
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });
    const tenantBrandName = tenant?.name ?? 'EduAI Ultimate';
    // Generate UUID-based certificate ID
    const certificateId = (0, _crypto.randomUUID)();
    // SHA-256 hash for tamper-proof verification
    const verificationHash = (0, _crypto.createHash)('sha256').update(JSON.stringify({
      progressId,
      courseName,
      recipientName,
      completionDate
    })).digest('hex');
    const verificationUrl = `${this.appBaseUrl}/verify/${certificateId}`;
    const certData = {
      recipientName,
      courseName,
      completionDate,
      instructorName,
      tenantBrandName,
      certificateId,
      verificationUrl
    };
    // Generate PDF
    const pdfBuffer = await this.buildPDF(certData);
    // Find or create a default certificate template for this course/tenant
    let template = await this.prisma.certificateTemplate.findFirst({
      where: {
        tenantId,
        courseId: progress.courseId
      }
    });
    if (!template) {
      template = await this.prisma.certificateTemplate.create({
        data: {
          name: `${courseName} Completion`,
          tenantId,
          courseId: progress.courseId,
          design: {
            title: 'Certificate of Completion',
            backgroundColor: '#f8f9ff',
            textColor: '#1F2937',
            showSignature: true
          },
          fields: []
        }
      });
    }
    // Persist the issued certificate (reuse verifyCode = certificateId for lookup)
    await this.prisma.issuedCertificate.upsert({
      where: {
        verifyCode: certificateId
      },
      create: {
        templateId: template.id,
        studentId: progress.studentId,
        userId: progress.student.userId,
        verifyCode: certificateId,
        metadata: {
          certificateHash: verificationHash,
          instructorName,
          tenantBrandName,
          completionDate: completionDate.toISOString()
        }
      },
      update: {}
    });
    return {
      certificateId,
      pdfBuffer,
      verificationHash
    };
  }
  // ── Verify ─────────────────────────────────────────────────────────────────
  /**
   * Public verification endpoint — looks up by certificateId (stored as verifyCode).
   */
  async verifyCertificate(certificateId) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: {
        verifyCode: certificateId
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        template: {
          include: {
            course: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
    if (!cert) {
      return {
        valid: false,
        issuedAt: new Date()
      };
    }
    const meta = cert.metadata;
    const certData = {
      recipientName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      courseName: cert.template.course?.title ?? 'Course',
      completionDate: cert.issuedAt,
      instructorName: meta?.instructorName ?? 'EduAI Team',
      tenantBrandName: meta?.tenantBrandName ?? 'EduAI Ultimate',
      certificateId,
      verificationUrl: `${this.appBaseUrl}/verify/${certificateId}`
    };
    return {
      valid: true,
      data: certData,
      issuedAt: cert.issuedAt
    };
  }
  // ── List ───────────────────────────────────────────────────────────────────
  /**
   * Return all certificates issued to a user.
   */
  async getCertificates(userId) {
    const certs = await this.prisma.issuedCertificate.findMany({
      where: {
        userId
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        template: {
          include: {
            course: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
    return certs.map(c => {
      const meta = c.metadata;
      return {
        id: c.id,
        userId: c.userId ?? '',
        courseId: c.template.courseId ?? '',
        studentId: c.studentId,
        verifyCode: c.verifyCode,
        certificateHash: meta?.certificateHash ?? '',
        issuedAt: c.issuedAt,
        recipientName: `${c.student.user.firstName} ${c.student.user.lastName}`,
        courseName: c.template.course?.title ?? 'Course',
        instructorName: meta?.instructorName ?? 'EduAI Team',
        tenantBrandName: meta?.tenantBrandName ?? 'EduAI Ultimate'
      };
    });
  }
  // ── Download ───────────────────────────────────────────────────────────────
  /**
   * Regenerate PDF on demand for a specific certificate + user.
   */
  async downloadCertificate(certificateId, userId) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: {
        verifyCode: certificateId
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        template: {
          include: {
            course: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
    if (!cert) {
      throw new _common.NotFoundException('Certificate not found');
    }
    if (cert.userId !== userId) {
      throw new _common.NotFoundException('Certificate not found for this user');
    }
    const meta = cert.metadata;
    return this.buildPDF({
      recipientName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      courseName: cert.template.course?.title ?? 'Course',
      completionDate: cert.issuedAt,
      instructorName: meta?.instructorName ?? 'EduAI Team',
      tenantBrandName: meta?.tenantBrandName ?? 'EduAI Ultimate',
      certificateId,
      verificationUrl: `${this.appBaseUrl}/verify/${certificateId}`
    });
  }
  // ── PDF generation ─────────────────────────────────────────────────────────
  buildPDF(data) {
    const accent = '#2563EB';
    const accent2 = '#7C3AED';
    const fg = '#1F2937';
    return new Promise((resolve, reject) => {
      const doc = new _pdfkit.default({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      const W = doc.page.width;
      const H = doc.page.height;
      // Background
      doc.rect(0, 0, W, H).fill('#f8f9ff');
      // Decorative border (double)
      doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(accent);
      doc.rect(30, 30, W - 60, H - 60).lineWidth(1).stroke(accent2);
      // Title
      doc.fontSize(36).fillColor(accent).font('Helvetica-Bold').text('Certificate of Completion', 0, 80, {
        align: 'center'
      });
      // Brand
      doc.fontSize(12).fillColor('#9CA3AF').font('Helvetica').text(data.tenantBrandName, 0, 125, {
        align: 'center'
      });
      // Intro line
      doc.fontSize(16).fillColor('#4B5563').font('Helvetica').text('This is to certify that', 0, 155, {
        align: 'center'
      });
      // Recipient name
      doc.fontSize(30).fillColor(fg).font('Helvetica-Bold').text(data.recipientName, 0, 182, {
        align: 'center'
      });
      // Completion text
      doc.fontSize(16).fillColor('#4B5563').font('Helvetica').text('has successfully completed', 0, 228, {
        align: 'center'
      });
      // Course name
      doc.fontSize(22).fillColor(accent2).font('Helvetica-Bold').text(data.courseName, 0, 254, {
        align: 'center'
      });
      // Date
      const dateStr = data.completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(13).fillColor('#6B7280').font('Helvetica').text(`Issued on ${dateStr}`, 0, 305, {
        align: 'center'
      });
      // Instructor signature line
      const sigX = W / 2 - 80;
      doc.moveTo(sigX, 350).lineTo(sigX + 160, 350).lineWidth(0.5).stroke('#9CA3AF');
      doc.fontSize(10).fillColor('#9CA3AF').text(data.instructorName, sigX - 10, 355, {
        width: 180,
        align: 'center'
      });
      doc.fontSize(9).fillColor('#C4C4C4').text('Instructor', sigX - 10, 367, {
        width: 180,
        align: 'center'
      });
      // Verification URL (bottom left)
      doc.fontSize(8).fillColor('#9CA3AF').text(`Verify at: ${data.verificationUrl}`, 40, H - 50, {
        width: 300
      });
      // Certificate ID (bottom left, below URL)
      doc.fontSize(8).fillColor('#9CA3AF').text(`Certificate ID: ${data.certificateId}`, 40, H - 38);
      // Footer brand (center)
      doc.fontSize(11).fillColor('#9CA3AF').text('EduAI Ultimate · Powered by AI', 0, H - 44, {
        align: 'center'
      });
      doc.end();
    });
  }
};
exports.CertificateGeneratorService = CertificateGeneratorService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_config.ConfigService)), __metadata("design:paramtypes", [Object, Object])], CertificateGeneratorService);