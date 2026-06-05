import { Injectable, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async issueCertificate(studentId: string, templateId: string, metadata: Record<string, unknown> = {}) {
    const template = await this.prisma.certificateTemplate.findUnique({ where: { id: templateId }, include: { course: true } });
    if (!template) throw new NotFoundException('Certificate template not found');

    const student = await this.prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student) throw new NotFoundException('Student not found');

    const pdfBuffer = await this.generatePDF({
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      courseName: template.course?.title ?? 'Course',
      issuedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      templateName: template.name,
    });

    const pdfFile: Express.Multer.File = {
      fieldname: 'certificate',
      originalname: `certificate-${studentId}-${Date.now()}.pdf`,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const { url } = await this.storage.upload(pdfFile, 'certificates');

    return this.prisma.issuedCertificate.create({
      data: {
        templateId,
        studentId,
        metadata: { ...metadata, pdfUrl: url },
      },
    });
  }

  private generatePDF(data: { studentName: string; courseName: string; issuedDate: string; templateName: string }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9ff');

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3).stroke('#2563EB');

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(1).stroke('#7C3AED');

      // Header
      doc.fontSize(36).fillColor('#2563EB').font('Helvetica-Bold')
        .text('Certificate of Completion', 0, 80, { align: 'center' });

      // Body
      doc.fontSize(16).fillColor('#4B5563').font('Helvetica')
        .text('This is to certify that', 0, 160, { align: 'center' });

      doc.fontSize(28).fillColor('#1F2937').font('Helvetica-Bold')
        .text(data.studentName, 0, 190, { align: 'center' });

      doc.fontSize(16).fillColor('#4B5563').font('Helvetica')
        .text('has successfully completed', 0, 240, { align: 'center' });

      doc.fontSize(22).fillColor('#7C3AED').font('Helvetica-Bold')
        .text(data.courseName, 0, 270, { align: 'center' });

      doc.fontSize(14).fillColor('#6B7280').font('Helvetica')
        .text(`Issued on ${data.issuedDate}`, 0, 330, { align: 'center' });

      // Footer
      doc.fontSize(12).fillColor('#9CA3AF')
        .text('EduAI Ultimate', 0, doc.page.height - 80, { align: 'center' });

      doc.end();
    });
  }

  async verifyCertificate(verifyCode: string) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: { verifyCode },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        template: { include: { course: { select: { title: true } } } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found or invalid');
    return cert;
  }

  async getStudentCertificates(studentId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { studentId },
      include: { template: { include: { course: { select: { title: true, thumbnailUrl: true } } } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getTemplates(courseId?: string) {
    return this.prisma.certificateTemplate.findMany({
      where: courseId ? { courseId } : {},
      include: { course: { select: { title: true } } },
    });
  }
}
