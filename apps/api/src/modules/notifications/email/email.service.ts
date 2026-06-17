import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly templateCache = new Map<string, string>();
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('EMAIL_FROM', 'EduAI <noreply@eduai.example.com>');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.sendgrid.net'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: config.get<string>('SMTP_USER', 'apikey'),
        pass: config.get<string>('SMTP_PASS', ''),
      },
    });
  }

  // ── Public typed send methods ──────────────────────────────────────────────

  async sendWelcome(
    to: string,
    data: { name: string; tenantName: string; loginUrl: string },
  ): Promise<void> {
    const html = this.renderTemplate('welcome', data);
    await this.send(to, `Welcome to ${data.tenantName} — Let's get started!`, html);
  }

  async sendEmailVerification(
    to: string,
    data: { name: string; verifyUrl: string },
  ): Promise<void> {
    const html = this.renderTemplate('email-verification', data);
    await this.send(to, 'Verify your email address', html);
  }

  async sendPasswordReset(
    to: string,
    data: { name: string; resetUrl: string; expiresIn: string },
  ): Promise<void> {
    const html = this.renderTemplate('password-reset', data);
    await this.send(to, 'Reset your password', html);
  }

  async sendCourseEnrollment(
    to: string,
    data: { name: string; courseName: string; courseUrl: string; instructorName: string },
  ): Promise<void> {
    const html = this.renderTemplate('course-enrollment', data);
    await this.send(to, `You're enrolled in ${data.courseName}!`, html);
  }

  async sendCertificate(
    to: string,
    data: { name: string; courseName: string; certificateUrl: string; completedAt: string },
  ): Promise<void> {
    const html = this.renderTemplate('certificate', data);
    await this.send(to, `Your certificate for ${data.courseName} is ready!`, html);
  }

  async sendPaymentSucceeded(
    to: string,
    data: { name: string; plan: string; amount: string; invoiceUrl: string; nextBillingDate: string },
  ): Promise<void> {
    const html = this.renderTemplate('payment-succeeded', data);
    await this.send(to, `Payment confirmed — ${data.plan} plan`, html);
  }

  async sendPaymentFailed(
    to: string,
    data: { name: string; plan: string; retryDate: string; updatePaymentUrl: string },
  ): Promise<void> {
    const html = this.renderTemplate('payment-failed', data);
    await this.send(to, 'Action required: Payment failed', html);
  }

  async sendParentalConsent(
    to: string,
    data: { parentName: string; childName: string; consentUrl: string; platform: string },
  ): Promise<void> {
    const html = this.renderTemplate('parental-consent', data);
    await this.send(to, `Parental consent required for ${data.childName}`, html);
  }

  async sendScimUserProvisioned(
    to: string,
    data: { name: string; email: string; loginUrl: string; tempPassword?: string; platform?: string },
  ): Promise<void> {
    const templateData: Record<string, string> = {
      name: data.name,
      email: data.email,
      loginUrl: data.loginUrl,
      tempPassword: data.tempPassword ?? '(Set on first login)',
      platform: data.platform ?? 'EduAI',
    };
    const html = this.renderTemplate('scim-provisioned', templateData);
    await this.send(to, `Your ${templateData['platform']} account is ready`, html);
  }

  // ── Dev preview ────────────────────────────────────────────────────────────

  /**
   * Returns a rendered template with sample data. Only available outside production.
   */
  previewTemplate(templateName: string): string {
    const samples: Record<string, Record<string, string>> = {
      welcome: {
        name: 'Alice',
        tenantName: 'Springfield Academy',
        loginUrl: 'https://app.eduai.example.com/login',
      },
      'email-verification': {
        name: 'Alice',
        verifyUrl: 'https://app.eduai.example.com/verify-email?token=sample-token',
      },
      'password-reset': {
        name: 'Alice',
        resetUrl: 'https://app.eduai.example.com/reset-password?token=sample-token',
        expiresIn: '1 hour',
      },
      'course-enrollment': {
        name: 'Alice',
        courseName: 'Introduction to Machine Learning',
        courseUrl: 'https://app.eduai.example.com/courses/intro-ml',
        instructorName: 'Dr. Bob Smith',
      },
      certificate: {
        name: 'Alice',
        courseName: 'Introduction to Machine Learning',
        certificateUrl: 'https://app.eduai.example.com/certificates/ABC123',
        completedAt: 'June 11, 2025',
      },
      'payment-succeeded': {
        name: 'Alice',
        plan: 'Professional',
        amount: '$49.00',
        invoiceUrl: 'https://app.eduai.example.com/billing/invoices/INV-001',
        nextBillingDate: 'July 11, 2025',
      },
      'payment-failed': {
        name: 'Alice',
        plan: 'Professional',
        retryDate: 'June 14, 2025',
        updatePaymentUrl: 'https://app.eduai.example.com/billing/payment-method',
      },
      'parental-consent': {
        parentName: 'Mr. Johnson',
        childName: 'Emma Johnson',
        consentUrl: 'https://app.eduai.example.com/consent?token=sample-token',
        platform: 'EduAI',
      },
      'scim-provisioned': {
        name: 'Alice',
        email: 'alice@company.org',
        loginUrl: 'https://app.eduai.example.com/login',
        tempPassword: 'Temp@Pass123',
        platform: 'EduAI',
      },
    };

    const data = samples[templateName];
    if (!data) {
      return `<h1>Unknown template: ${templateName}</h1><p>Available: ${Object.keys(samples).join(', ')}</p>`;
    }

    return this.renderTemplate(templateName, data);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${subject}`, err);
    }
  }

  renderTemplate(templateName: string, data: Record<string, string>): string {
    let tpl = this.templateCache.get(templateName);

    if (!tpl) {
      const filePath = path.join(__dirname, 'templates', `${templateName}.html`);
      try {
        tpl = fs.readFileSync(filePath, 'utf-8');
        this.templateCache.set(templateName, tpl);
      } catch {
        this.logger.error(`Email template not found: ${filePath}`);
        return `<p>Template "${templateName}" not found.</p>`;
      }
    }

    // Replace all {{key}} placeholders
    return tpl.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '';
    });
  }
}
