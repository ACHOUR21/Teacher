/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';

import { PrismaService } from '../database/prisma.service';

import { TaxService, type TaxCalculation } from './tax.service';

// ──────────────────────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string;
  amount: number; // cents
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  amount: number;   // subtotal in cents
  tax: number;      // tax in cents
  total: number;    // total with tax in cents
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  issuedAt: Date;
  dueAt: Date;
  paidAt: Date | null;
  lineItems: InvoiceLineItem[];
  taxCalculation?: TaxCalculation;
  countryCode?: string;
}

export interface PaginatedInvoices {
  invoices: InvoiceData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxService: TaxService,
  ) {}

  // ── public: list invoices ──────────────────────────────────────────────────

  async listInvoices(tenantId: string, page = 1, limit = 20): Promise<PaginatedInvoices> {
    const subscription = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!subscription) {
      return { invoices: [], total: 0, page, limit, totalPages: 0 };
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where: { subscriptionId: subscription.id } }),
    ]);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });

    const invoices: InvoiceData[] = rows.map((inv, idx) => {
      const amountCents = Math.round(Number(inv.amount) * 100);
      return {
        id: inv.id,
        invoiceNumber: inv.stripeInvoiceId ?? `INV-${String(total - skip - idx).padStart(4, '0')}`,
        tenantId,
        tenantName: tenant?.name ?? tenantId,
        plan: subscription.plan,
        amount: amountCents,
        tax: 0,
        total: amountCents,
        currency: inv.currency,
        status: this._mapPaymentStatus(inv.status),
        issuedAt: inv.issuedAt,
        dueAt: inv.issuedAt,
        paidAt: inv.paidAt,
        lineItems: [
          { description: `${subscription.plan.replace('_', ' ')} Plan`, amount: amountCents },
        ],
      };
    });

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── public: get single invoice ─────────────────────────────────────────────

  async getInvoice(invoiceId: string, tenantId: string): Promise<InvoiceData> {
    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: { include: { tenant: true } } },
    });
    if (!inv) {throw new NotFoundException('Invoice not found');}
    if (inv.subscription.tenantId !== tenantId) {throw new NotFoundException('Invoice not found');}

    const amountCents = Math.round(Number(inv.amount) * 100);
    const subscription = inv.subscription;

    return {
      id: inv.id,
      invoiceNumber: inv.stripeInvoiceId ?? `INV-${inv.id.slice(-6).toUpperCase()}`,
      tenantId,
      tenantName: subscription.tenant.name,
      plan: subscription.plan,
      amount: amountCents,
      tax: 0,
      total: amountCents,
      currency: inv.currency,
      status: this._mapPaymentStatus(inv.status),
      issuedAt: inv.issuedAt,
      dueAt: inv.issuedAt,
      paidAt: inv.paidAt,
      lineItems: [
        { description: `${subscription.plan.replace('_', ' ')} Plan`, amount: amountCents },
      ],
    };
  }

  // ── public: generate PDF ───────────────────────────────────────────────────

  async generateInvoicePdf(invoiceId: string, tenantId: string): Promise<Buffer> {
    const data = await this.getInvoice(invoiceId, tenantId);
    return this._buildPdf(data);
  }

  // ── internal: PDF builder ──────────────────────────────────────────────────

  private _buildPdf(invoice: InvoiceData): Buffer {
    // Dynamic require so pdfkit is only loaded when needed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const PDFDocument = require('pdfkit') as typeof import('pdfkit');

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', (c: Buffer) => chunks.push(c));

    const PRIMARY   = '#2563EB';
    const DARK      = '#111827';
    const MUTED     = '#6B7280';
    const LIGHT     = '#F3F4F6';
    const GREEN     = '#16A34A';
    const RED       = '#DC2626';

    // ── Header band ──
    doc.rect(0, 0, 595, 90).fill(PRIMARY);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('EduAI', 50, 30);
    doc.fontSize(10).font('Helvetica').text('AI-Powered Education Platform', 50, 56);
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 380, 30, { align: 'right', width: 165 });

    // ── Invoice meta ──
    doc.fillColor(DARK).fontSize(10).font('Helvetica');
    const metaY = 110;
    doc.font('Helvetica-Bold').text('Invoice Number:', 50, metaY).font('Helvetica').text(invoice.invoiceNumber, 155, metaY);
    doc.font('Helvetica-Bold').text('Issue Date:', 50, metaY + 16).font('Helvetica').text(this._fmtDate(invoice.issuedAt), 155, metaY + 16);
    doc.font('Helvetica-Bold').text('Due Date:', 50, metaY + 32).font('Helvetica').text(this._fmtDate(invoice.dueAt), 155, metaY + 32);

    // Status badge (right side)
    const statusColor = invoice.status === 'paid' ? GREEN : invoice.status === 'overdue' ? RED : '#D97706';
    const statusText  = invoice.status.toUpperCase();
    doc.roundedRect(430, metaY - 4, 115, 28, 6).fill(invoice.status === 'paid' ? '#DCFCE7' : invoice.status === 'overdue' ? '#FEE2E2' : '#FEF3C7');
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(12).text(statusText, 440, metaY + 4);

    // ── Bill To ──
    const billY = 180;
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('BILL TO', 50, billY);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11).text(invoice.tenantName, 50, billY + 14);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text(`Tenant ID: ${invoice.tenantId}`, 50, billY + 28)
       .text(`Plan: ${invoice.plan.replace(/_/g, ' ')}`, 50, billY + 42);

    // ── Line items table ──
    const tableY = 265;
    // Header row
    doc.rect(50, tableY, 495, 28).fill(LIGHT);
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
       .text('DESCRIPTION', 60, tableY + 9)
       .text('AMOUNT', 480, tableY + 9, { align: 'right', width: 55 });

    let rowY = tableY + 28;
    for (const item of invoice.lineItems) {
      doc.fillColor(DARK).font('Helvetica').fontSize(10)
         .text(item.description, 60, rowY + 8)
         .text(this._fmtMoney(item.amount, invoice.currency), 480, rowY + 8, { align: 'right', width: 55 });
      doc.moveTo(50, rowY + 28).lineTo(545, rowY + 28).strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      rowY += 30;
    }

    // ── Totals box ──
    rowY += 10;
    const totalsX = 350;

    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('Subtotal', totalsX, rowY);
    doc.fillColor(DARK).font('Helvetica').fontSize(9).text(this._fmtMoney(invoice.amount, invoice.currency), 480, rowY, { align: 'right', width: 55 });

    if (invoice.tax > 0 && invoice.taxCalculation) {
      rowY += 18;
      doc.fillColor(MUTED).font('Helvetica').fontSize(9)
         .text(this.taxService.formatTaxLine(invoice.taxCalculation), totalsX, rowY);
      doc.fillColor(DARK).text(this._fmtMoney(invoice.tax, invoice.currency), 480, rowY, { align: 'right', width: 55 });
    } else {
      rowY += 18;
      doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('Tax', totalsX, rowY);
      doc.fillColor(DARK).text('$0.00', 480, rowY, { align: 'right', width: 55 });
    }

    // Total line
    rowY += 10;
    doc.rect(totalsX - 10, rowY, 215, 32).fill('#EFF6FF');
    rowY += 8;
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(12).text('Total', totalsX, rowY);
    doc.text(this._fmtMoney(invoice.total, invoice.currency), 480, rowY, { align: 'right', width: 55 });

    // ── Tax notice ──
    if (invoice.tax > 0) {
      rowY += 50;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8)
         .text('* Tax has been calculated based on your billing country.', 50, rowY);
    } else {
      rowY += 50;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8)
         .text('* Prices exclude VAT. Tax may be calculated at checkout based on your billing country.', 50, rowY);
    }

    // ── Footer ──
    const footerY = 750;
    doc.rect(0, footerY, 595, 92).fill('#F9FAFB');
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('Questions? Contact us at support@eduai.io', 50, footerY + 12)
       .text('Terms of Service: https://eduai.io/terms  |  Privacy Policy: https://eduai.io/privacy', 50, footerY + 26)
       .text('EduAI Inc. — AI-Powered Education Platform', 50, footerY + 40);

    if (invoice.paidAt) {
      doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8)
         .text(`Paid on ${this._fmtDate(invoice.paidAt)}`, 50, footerY + 56);
    }

    doc.end();

    // Collect synchronously (pdfkit emits all data on end())
    return Buffer.concat(chunks);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private _mapPaymentStatus(status: string): 'paid' | 'pending' | 'overdue' {
    switch (status) {
      case 'COMPLETED': return 'paid';
      case 'FAILED':    return 'overdue';
      default:          return 'pending';
    }
  }

  private _fmtDate(date: Date | null | undefined): string {
    if (!date) {return 'N/A';}
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private _fmtMoney(cents: number, currency = 'USD'): string {
    const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : `${currency} `;
    return `${sym}${(cents / 100).toFixed(2)}`;
  }
}
