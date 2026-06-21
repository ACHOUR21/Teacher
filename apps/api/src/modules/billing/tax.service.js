"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TaxService = void 0;
var _common = require("@nestjs/common");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────
let TaxService = exports.TaxService = class TaxService {
  /**
   * Simplified rule-based tax rates by country (ISO 3166-1 alpha-2).
   * A production system should integrate Avalara or TaxJar for full compliance.
   */
  TAX_RATES = {
    US: {
      rate: 0,
      name: 'No federal sales tax'
    },
    // handled at state level
    GB: {
      rate: 0.20,
      name: 'UK VAT'
    },
    DE: {
      rate: 0.19,
      name: 'German MwSt'
    },
    FR: {
      rate: 0.20,
      name: 'French TVA'
    },
    AU: {
      rate: 0.10,
      name: 'Australian GST'
    },
    CA: {
      rate: 0.05,
      name: 'Canadian GST'
    },
    IN: {
      rate: 0.18,
      name: 'Indian GST'
    },
    BR: {
      rate: 0.15,
      name: 'Brazilian ISS'
    },
    NL: {
      rate: 0.21,
      name: 'Dutch BTW'
    },
    ES: {
      rate: 0.21,
      name: 'Spanish IVA'
    },
    IT: {
      rate: 0.22,
      name: 'Italian IVA'
    },
    PL: {
      rate: 0.23,
      name: 'Polish VAT'
    },
    SE: {
      rate: 0.25,
      name: 'Swedish Moms'
    },
    NO: {
      rate: 0.25,
      name: 'Norwegian MVA'
    },
    CH: {
      rate: 0.081,
      name: 'Swiss MWST'
    },
    SG: {
      rate: 0.09,
      name: 'Singapore GST'
    },
    JP: {
      rate: 0.10,
      name: 'Japanese Consumption Tax'
    },
    NZ: {
      rate: 0.15,
      name: 'New Zealand GST'
    },
    ZA: {
      rate: 0.15,
      name: 'South African VAT'
    },
    MX: {
      rate: 0.16,
      name: 'Mexican IVA'
    }
    // Default: 0 (tax-exempt or not collected)
  };
  /**
   * Calculate tax for a given amount and country code.
   *
   * @param amountCents  Pre-tax amount in cents
   * @param countryCode  ISO 3166-1 alpha-2 country code (e.g. "GB", "DE")
   */
  calculateTax(amountCents, countryCode) {
    const entry = this.TAX_RATES[countryCode?.toUpperCase()] ?? {
      rate: 0,
      name: 'No tax'
    };
    const taxAmount = Math.round(amountCents * entry.rate);
    return {
      taxRate: entry.rate,
      taxAmount,
      taxName: entry.name,
      totalWithTax: amountCents + taxAmount
    };
  }
  /** Returns the tax rate (0–1) for a given country. Returns 0 for unknown countries. */
  getTaxRateForCountry(countryCode) {
    return this.TAX_RATES[countryCode?.toUpperCase()]?.rate ?? 0;
  }
  /**
   * Format a tax line for human display.
   * Example: "$4.00 VAT (20%)"
   */
  formatTaxLine(taxCalculation) {
    if (taxCalculation.taxAmount === 0) {
      return 'No tax applicable';
    }
    const dollars = (taxCalculation.taxAmount / 100).toFixed(2);
    const pct = (taxCalculation.taxRate * 100).toFixed(taxCalculation.taxRate < 0.01 ? 1 : 0);
    return `$${dollars} ${taxCalculation.taxName} (${pct}%)`;
  }
};
exports.TaxService = TaxService = __decorate([(0, _common.Injectable)()], TaxService);