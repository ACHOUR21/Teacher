import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';

interface PDFData {
  studentName: string;
  courseName: string;
  issuedDate: string;
  templateName: string;
  verifyCode: string;
  appBaseUrl: string;
  design?: {
    title?: string;
    bodyText?: string;
    backgroundColor?: string;
    textColor?: string;
    borderStyle?: string;
    showSignature?: boolean;
  };
}

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  private get appBaseUrl(): string {
    return this.config.get<string>('APP_BASE_URL') ?? 'https://app.eduai.io';
  }

  // ---- Core issuance (by studentId) ----------------------------------------

  async issueCertificate(studentId: string, templateId: string, metadata: Record<string, unknown> = {}) {
    const template = await this.prisma.certificateTemplate.findUnique({ where: { id: templateId }, include: { course: true } });
    if (!template) throw new NotFoundException('Certificate template not found');

    const student = await this.prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student) throw new NotFoundException('Student not found');

    // Pre-create record to get the verifyCode
    const cert = await this.prisma.issuedCertificate.create({
      data: {
        templateId,
        studentId,
        userId: student.userId,
        metadata: metadata as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    const pdfBuffer = await this.generatePDF({
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      courseName: template.course?.title ?? 'Course',
      issuedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      templateName: template.name,
      verifyCode: cert.verifyCode,
      appBaseUrl: this.appBaseUrl,
      design: template.design as PDFData['design'],
    });

    const { url } = await this.storage.upload(
      {
        fieldname: 'certificate',
        originalname: `certificate-${cert.id}.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
        size: pdfBuffer.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      },
      'certificates',
    );

    return this.prisma.issuedCertificate.update({
      where: { id: cert.id },
      data: { metadata: { ...metadata, pdfUrl: url } as import('@prisma/client').Prisma.InputJsonValue },
    });
  }

  // ---- Issue directly by userId (for exam completions, manual admin issue) ---

  async issueToUser(
    userId: string,
    templateId: string,
    metadata: Record<string, unknown> = {},
  ) {
    const template = await this.prisma.certificateTemplate.findUnique({ where: { id: templateId }, include: { course: true } });
    if (!template) throw new NotFoundException('Certificate template not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if already issued for this template+user
    const existing = await this.prisma.issuedCertificate.findFirst({ where: { userId, templateId } });
    if (existing) return existing;

    // Find or create student profile
    let student = await this.prisma.student.findFirst({ where: { userId } });
    if (!student) {
      student = await this.prisma.student.create({ data: { userId } });
    }

    return this.issueCertificate(student.id, templateId, metadata);
  }

  // ---- PDF generation -------------------------------------------------------

  private async generatePDF(data: PDFData): Promise<Buffer> {
    const verifyUrl = `${data.appBaseUrl}/verify/${data.verifyCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 100, margin: 1 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const bg = data.design?.backgroundColor ?? '#f8f9ff';
    const fg = data.design?.textColor ?? '#1F2937';
    const accent = '#2563EB';
    const accent2 = '#7C3AED';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
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
      doc.fontSize(36).fillColor(accent).font('Helvetica-Bold')
        .text(title, 0, 80, { align: 'center' });

      // Body
      const body = data.design?.bodyText ?? 'This is to certify that';
      doc.fontSize(16).fillColor('#4B5563').font('Helvetica')
        .text(body, 0, 155, { align: 'center' });

      doc.fontSize(28).fillColor(fg).font('Helvetica-Bold')
        .text(data.studentName, 0, 185, { align: 'center' });

      doc.fontSize(16).fillColor('#4B5563').font('Helvetica')
        .text('has successfully completed', 0, 230, { align: 'center' });

      doc.fontSize(22).fillColor(accent2).font('Helvetica-Bold')
        .text(data.courseName, 0, 258, { align: 'center' });

      doc.fontSize(13).fillColor('#6B7280').font('Helvetica')
        .text(`Issued on ${data.issuedDate}`, 0, 310, { align: 'center' });

      // Signature line
      if (data.design?.showSignature !== false) {
        const sigX = W / 2 - 80;
        doc.moveTo(sigX, 355).lineTo(sigX + 160, 355).lineWidth(0.5).stroke('#9CA3AF');
        doc.fontSize(10).fillColor('#9CA3AF').text('Authorized Signature', sigX - 10, 360, { width: 180, align: 'center' });
      }

      // QR code (bottom right)
      doc.image(qrBuffer, W - 130, H - 130, { width: 90 });
      doc.fontSize(8).fillColor('#9CA3AF')
        .text('Verify at:', W - 140, H - 40, { width: 120, align: 'center' });
      doc.text(verifyUrl, W - 140, H - 30, { width: 120, align: 'center' });

      // Verify code (bottom left)
      doc.fontSize(9).fillColor('#9CA3AF')
        .text(`Credential ID: ${data.verifyCode}`, 40, H - 45, { width: 200 });

      // Footer brand
      doc.fontSize(12).fillColor('#9CA3AF')
        .text('EduAI Ultimate', 0, H - 50, { align: 'center' });

      doc.end();
    });
  }

  // ---- Verification (public) -----------------------------------------------

  async verifyCertificate(verifyCode: string) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: { verifyCode },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        template: { include: { course: { select: { title: true } } } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found or invalid code');
    return {
      valid: true,
      recipientName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      course: cert.template.course?.title ?? null,
      templateName: cert.template.name,
      issuedAt: cert.issuedAt,
      verifyCode: cert.verifyCode,
    };
  }

  // ---- Listing -------------------------------------------------------------

  async getStudentCertificates(studentId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { studentId },
      include: { template: { include: { course: { select: { title: true, thumbnailUrl: true } } } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getUserCertificates(userId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { userId },
      include: { template: { include: { course: { select: { title: true, thumbnailUrl: true } } } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getTenantCertificates(tenantId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { template: { tenantId } },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        template: { include: { course: { select: { title: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // ---- Templates -----------------------------------------------------------

  async getTemplates(tenantId?: string, courseId?: string) {
    return this.prisma.certificateTemplate.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: { select: { title: true } },
        _count: { select: { issued: true } },
      },
    });
  }

  async createTemplate(dto: {
    name: string;
    title: string;
    bodyText?: string;
    backgroundColor?: string;
    textColor?: string;
    borderStyle?: string;
    showSignature?: boolean;
    courseId?: string;
    tenantId?: string;
  }) {
    const { name, courseId, tenantId, ...designFields } = dto;
    return this.prisma.certificateTemplate.create({
      data: {
        name,
        tenantId: tenantId ?? null,
        courseId: courseId ?? null,
        design: designFields as import('@prisma/client').Prisma.InputJsonValue,
        fields: [],
      },
    });
  }

  async issueCertificateByTemplate(dto: { templateId: string; courseId?: string; recipientId: string }) {
    return this.issueCertificate(dto.recipientId, dto.templateId);
  }

  // ---- Download ------------------------------------------------------------

  async downloadCertificate(certId: string) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: { id: certId },
      include: {
        student: { include: { user: true } },
        template: { include: { course: { select: { title: true } } } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return this.generatePDF({
      studentName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      courseName: cert.template.course?.title ?? 'Course',
      issuedDate: cert.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      templateName: cert.template.name,
      verifyCode: cert.verifyCode,
      appBaseUrl: this.appBaseUrl,
      design: cert.template.design as PDFData['design'],
    });
  }
}
