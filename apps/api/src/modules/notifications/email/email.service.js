"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EmailService = void 0;
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var nodemailer = _interopRequireWildcard(require("nodemailer"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
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
var EmailService_1;
let EmailService = exports.EmailService = EmailService_1 = class EmailService {
  logger = new _common.Logger(EmailService_1.name);
  transporter;
  templateCache = new Map();
  from;
  constructor(config) {
    this.config = config;
    this.from = config.get('EMAIL_FROM', 'EduAI <noreply@eduai.example.com>');
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'smtp.sendgrid.net'),
      port: config.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: config.get('SMTP_USER', 'apikey'),
        pass: config.get('SMTP_PASS', '')
      }
    });
  }
  // ── Public typed send methods ──────────────────────────────────────────────
  async sendWelcome(to, data) {
    const html = this.renderTemplate('welcome', data);
    await this.send(to, `Welcome to ${data.tenantName} — Let's get started!`, html);
  }
  async sendEmailVerification(to, data) {
    const html = this.renderTemplate('email-verification', data);
    await this.send(to, 'Verify your email address', html);
  }
  async sendPasswordReset(to, data) {
    const html = this.renderTemplate('password-reset', data);
    await this.send(to, 'Reset your password', html);
  }
  async sendCourseEnrollment(to, data) {
    const html = this.renderTemplate('course-enrollment', data);
    await this.send(to, `You're enrolled in ${data.courseName}!`, html);
  }
  async sendCertificate(to, data) {
    const html = this.renderTemplate('certificate', data);
    await this.send(to, `Your certificate for ${data.courseName} is ready!`, html);
  }
  async sendPaymentSucceeded(to, data) {
    const html = this.renderTemplate('payment-succeeded', data);
    await this.send(to, `Payment confirmed — ${data.plan} plan`, html);
  }
  async sendPaymentFailed(to, data) {
    const html = this.renderTemplate('payment-failed', data);
    await this.send(to, 'Action required: Payment failed', html);
  }
  async sendParentalConsent(to, data) {
    const html = this.renderTemplate('parental-consent', data);
    await this.send(to, `Parental consent required for ${data.childName}`, html);
  }
  async sendScimUserProvisioned(to, data) {
    const templateData = {
      name: data.name,
      email: data.email,
      loginUrl: data.loginUrl,
      tempPassword: data.tempPassword ?? '(Set on first login)',
      platform: data.platform ?? 'EduAI'
    };
    const html = this.renderTemplate('scim-provisioned', templateData);
    await this.send(to, `Your ${templateData['platform']} account is ready`, html);
  }
  // ── Dev preview ────────────────────────────────────────────────────────────
  /**
   * Returns a rendered template with sample data. Only available outside production.
   */
  previewTemplate(templateName) {
    const samples = {
      welcome: {
        name: 'Alice',
        tenantName: 'Springfield Academy',
        loginUrl: 'https://app.eduai.example.com/login'
      },
      'email-verification': {
        name: 'Alice',
        verifyUrl: 'https://app.eduai.example.com/verify-email?token=sample-token'
      },
      'password-reset': {
        name: 'Alice',
        resetUrl: 'https://app.eduai.example.com/reset-password?token=sample-token',
        expiresIn: '1 hour'
      },
      'course-enrollment': {
        name: 'Alice',
        courseName: 'Introduction to Machine Learning',
        courseUrl: 'https://app.eduai.example.com/courses/intro-ml',
        instructorName: 'Dr. Bob Smith'
      },
      certificate: {
        name: 'Alice',
        courseName: 'Introduction to Machine Learning',
        certificateUrl: 'https://app.eduai.example.com/certificates/ABC123',
        completedAt: 'June 11, 2025'
      },
      'payment-succeeded': {
        name: 'Alice',
        plan: 'Professional',
        amount: '$49.00',
        invoiceUrl: 'https://app.eduai.example.com/billing/invoices/INV-001',
        nextBillingDate: 'July 11, 2025'
      },
      'payment-failed': {
        name: 'Alice',
        plan: 'Professional',
        retryDate: 'June 14, 2025',
        updatePaymentUrl: 'https://app.eduai.example.com/billing/payment-method'
      },
      'parental-consent': {
        parentName: 'Mr. Johnson',
        childName: 'Emma Johnson',
        consentUrl: 'https://app.eduai.example.com/consent?token=sample-token',
        platform: 'EduAI'
      },
      'scim-provisioned': {
        name: 'Alice',
        email: 'alice@company.org',
        loginUrl: 'https://app.eduai.example.com/login',
        tempPassword: 'Temp@Pass123',
        platform: 'EduAI'
      }
    };
    const data = samples[templateName];
    if (!data) {
      return `<h1>Unknown template: ${templateName}</h1><p>Available: ${Object.keys(samples).join(', ')}</p>`;
    }
    return this.renderTemplate(templateName, data);
  }
  // ── Private helpers ────────────────────────────────────────────────────────
  async send(to, subject, html) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${subject}`, err);
    }
  }
  renderTemplate(templateName, data) {
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
    return tpl.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '';
    });
  }
};
exports.EmailService = EmailService = EmailService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __metadata("design:paramtypes", [Object])], EmailService);