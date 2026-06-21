"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificatesService = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _pdfkit = _interopRequireDefault(require("pdfkit"));
var QRCode = _interopRequireWildcard(require("qrcode"));
var _prisma = require("../database/prisma.service");
var _storage = require("../storage/storage.service");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
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
let CertificatesService = exports.CertificatesService = class CertificatesService {
  constructor(prisma, storage, config) {
    this.prisma = prisma;
    this.storage = storage;
    this.config = config;
  }
  get appBaseUrl() {
    return this.config.get('APP_BASE_URL') ?? 'https://app.eduai.io';
  }
  // ---- Core issuance (by studentId) ----------------------------------------
  async issueCertificate(studentId, templateId, metadata = {}) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: {
        id: templateId
      },
      include: {
        course: true
      }
    });
    if (!template) {
      throw new _common.NotFoundException('Certificate template not found');
    }
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: true
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    // Pre-create record to get the verifyCode
    const cert = await this.prisma.issuedCertificate.create({
      data: {
        templateId,
        studentId,
        userId: student.userId,
        metadata: metadata
      }
    });
    const pdfBuffer = await this.generatePDF({
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      courseName: template.course?.title ?? 'Course',
      issuedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      templateName: template.name,
      verifyCode: cert.verifyCode,
      appBaseUrl: this.appBaseUrl,
      design: template.design
    });
    const {
      url
    } = await this.storage.upload({
      fieldname: 'certificate',
      originalname: `certificate-${cert.id}.pdf`,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stream: null,
      destination: '',
      filename: '',
      path: ''
    }, 'certificates');
    return this.prisma.issuedCertificate.update({
      where: {
        id: cert.id
      },
      data: {
        metadata: {
          ...metadata,
          pdfUrl: url
        }
      }
    });
  }
  // ---- Issue directly by userId (for exam completions, manual admin issue) ---
  async issueToUser(userId, templateId, metadata = {}) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: {
        id: templateId
      },
      include: {
        course: true
      }
    });
    if (!template) {
      throw new _common.NotFoundException('Certificate template not found');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    // Check if already issued for this template+user
    const existing = await this.prisma.issuedCertificate.findFirst({
      where: {
        userId,
        templateId
      }
    });
    if (existing) {
      return existing;
    }
    // Find or create student profile
    let student = await this.prisma.student.findFirst({
      where: {
        userId
      }
    });
    if (!student) {
      student = await this.prisma.student.create({
        data: {
          userId
        }
      });
    }
    return this.issueCertificate(student.id, templateId, metadata);
  }
  // ---- PDF generation -------------------------------------------------------
  async generatePDF(data) {
    const verifyUrl = `${data.appBaseUrl}/verify/${data.verifyCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 100,
      margin: 1
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const bg = data.design?.backgroundColor ?? '#f8f9ff';
    const fg = data.design?.textColor ?? '#1F2937';
    const accent = '#2563EB';
    const accent2 = '#7C3AED';
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
      doc.rect(0, 0, W, H).fill(bg);
      // Borders
      doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(accent);
      doc.rect(30, 30, W - 60, H - 60).lineWidth(1).stroke(accent2);
      // Title
      const title = data.design?.title ?? 'Certificate of Completion';
      doc.fontSize(36).fillColor(accent).font('Helvetica-Bold').text(title, 0, 80, {
        align: 'center'
      });
      // Body
      const body = data.design?.bodyText ?? 'This is to certify that';
      doc.fontSize(16).fillColor('#4B5563').font('Helvetica').text(body, 0, 155, {
        align: 'center'
      });
      doc.fontSize(28).fillColor(fg).font('Helvetica-Bold').text(data.studentName, 0, 185, {
        align: 'center'
      });
      doc.fontSize(16).fillColor('#4B5563').font('Helvetica').text('has successfully completed', 0, 230, {
        align: 'center'
      });
      doc.fontSize(22).fillColor(accent2).font('Helvetica-Bold').text(data.courseName, 0, 258, {
        align: 'center'
      });
      doc.fontSize(13).fillColor('#6B7280').font('Helvetica').text(`Issued on ${data.issuedDate}`, 0, 310, {
        align: 'center'
      });
      // Signature line
      if (data.design?.showSignature !== false) {
        const sigX = W / 2 - 80;
        doc.moveTo(sigX, 355).lineTo(sigX + 160, 355).lineWidth(0.5).stroke('#9CA3AF');
        doc.fontSize(10).fillColor('#9CA3AF').text('Authorized Signature', sigX - 10, 360, {
          width: 180,
          align: 'center'
        });
      }
      // QR code (bottom right)
      doc.image(qrBuffer, W - 130, H - 130, {
        width: 90
      });
      doc.fontSize(8).fillColor('#9CA3AF').text('Verify at:', W - 140, H - 40, {
        width: 120,
        align: 'center'
      });
      doc.text(verifyUrl, W - 140, H - 30, {
        width: 120,
        align: 'center'
      });
      // Verify code (bottom left)
      doc.fontSize(9).fillColor('#9CA3AF').text(`Credential ID: ${data.verifyCode}`, 40, H - 45, {
        width: 200
      });
      // Footer brand
      doc.fontSize(12).fillColor('#9CA3AF').text('EduAI Ultimate', 0, H - 50, {
        align: 'center'
      });
      doc.end();
    });
  }
  // ---- Verification (public) -----------------------------------------------
  async verifyCertificate(verifyCode) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: {
        verifyCode
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
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
      throw new _common.NotFoundException('Certificate not found or invalid code');
    }
    return {
      valid: true,
      recipientName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      course: cert.template.course?.title ?? null,
      templateName: cert.template.name,
      issuedAt: cert.issuedAt,
      verifyCode: cert.verifyCode
    };
  }
  // ---- Listing -------------------------------------------------------------
  async getStudentCertificates(studentId) {
    return this.prisma.issuedCertificate.findMany({
      where: {
        studentId
      },
      include: {
        template: {
          include: {
            course: {
              select: {
                title: true,
                thumbnailUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
  }
  async getUserCertificates(userId) {
    return this.prisma.issuedCertificate.findMany({
      where: {
        userId
      },
      include: {
        template: {
          include: {
            course: {
              select: {
                title: true,
                thumbnailUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
  }
  async getTenantCertificates(tenantId) {
    return this.prisma.issuedCertificate.findMany({
      where: {
        template: {
          tenantId
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
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
  }
  // ---- Templates -----------------------------------------------------------
  async getTemplates(tenantId, courseId) {
    return this.prisma.certificateTemplate.findMany({
      where: {
        ...(tenantId ? {
          tenantId
        } : {}),
        ...(courseId ? {
          courseId
        } : {})
      },
      include: {
        course: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            issued: true
          }
        }
      }
    });
  }
  async createTemplate(dto) {
    const {
      name,
      courseId,
      tenantId,
      ...designFields
    } = dto;
    return this.prisma.certificateTemplate.create({
      data: {
        name,
        tenantId: tenantId ?? null,
        courseId: courseId ?? null,
        design: designFields,
        fields: []
      }
    });
  }
  async issueCertificateByTemplate(dto) {
    return this.issueCertificate(dto.recipientId, dto.templateId);
  }
  // ---- Download ------------------------------------------------------------
  async downloadCertificate(certId) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: {
        id: certId
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
    return this.generatePDF({
      studentName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      courseName: cert.template.course?.title ?? 'Course',
      issuedDate: cert.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      templateName: cert.template.name,
      verifyCode: cert.verifyCode,
      appBaseUrl: this.appBaseUrl,
      design: cert.template.design
    });
  }
};
exports.CertificatesService = CertificatesService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_storage.StorageService)), __param(2, (0, _common.Inject)(_config.ConfigService)), __metadata("design:paramtypes", [Object, Object, Object])], CertificatesService);