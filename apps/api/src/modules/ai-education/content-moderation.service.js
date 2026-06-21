"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContentModerationService = void 0;
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _common = require("@nestjs/common");
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
var ContentModerationService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let ContentModerationService = exports.ContentModerationService = ContentModerationService_1 = class ContentModerationService {
  logger = new _common.Logger(ContentModerationService_1.name);
  client;
  SYSTEM_PROMPT = 'You are a content safety classifier for an educational platform. Classify the following text. ' + 'Return ONLY valid JSON: { "safe": boolean, "flagged": boolean, "categories": { "hate": boolean, "harassment": boolean, "selfHarm": boolean, "sexual": boolean, "violence": boolean, "spam": boolean }, "confidence": number, "reason": string, "action": "allow"|"flag"|"block" }';
  constructor(prisma) {
    this.prisma = prisma;
    this.client = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  async moderateContent(text, context) {
    const contextHint = context ? ` Context: ${context}.` : '';
    const userMessage = `${contextHint}\n\nText to classify:\n${text.substring(0, 4000)}`;
    try {
      const msg = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: this.SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      });
      const raw = msg.content[0].text;
      // Strip markdown code fences if present
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const result = JSON.parse(jsonText);
      return result;
    } catch (err) {
      this.logger.error('Content moderation failed', err);
      // Safe fallback — don't block content on AI error
      return {
        safe: true,
        flagged: false,
        categories: {
          hate: false,
          harassment: false,
          selfHarm: false,
          sexual: false,
          violence: false,
          spam: false
        },
        confidence: 0,
        reason: 'Moderation service temporarily unavailable',
        action: 'allow'
      };
    }
  }
  async moderateSubmission(submissionId, tenantId) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        student: {
          school: {
            tenantId
          }
        }
      }
    });
    if (!submission) {
      throw new _common.NotFoundException(`Submission ${submissionId} not found`);
    }
    const text = submission.content ?? (submission.attachments ?? []).join(' ');
    const result = await this.moderateContent(text, 'submission');
    const existingMeta = submission.metadata ?? {};
    const updatedMeta = {
      ...existingMeta,
      moderation: {
        result,
        moderatedAt: new Date().toISOString()
      }
    };
    await this.prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        metadata: updatedMeta
      }
    });
    if (result.flagged || result.action !== 'allow') {
      this.logger.warn(`Submission ${submissionId} flagged by moderation: action=${result.action}, reason=${result.reason ?? 'N/A'}`);
      // Emit event placeholder — in production wire to EventEmitter2/BullMQ
      // this.eventEmitter.emit('moderation.flagged', { submissionId, tenantId, result });
    }
    return result;
  }
  async getModerationQueue(tenantId, status) {
    const submissions = await this.prisma.submission.findMany({
      where: {
        student: {
          school: {
            tenantId
          }
        }
      },
      select: {
        id: true,
        metadata: true
      }
    });
    const queue = [];
    for (const sub of submissions) {
      const meta = sub.metadata ?? {};
      if (!meta.moderation) {
        continue;
      }
      const {
        result,
        moderatedAt,
        reviewedAt
      } = meta.moderation;
      if (!result.flagged && result.action === 'allow') {
        continue;
      }
      const reviewed = Boolean(reviewedAt);
      if (status === 'pending' && reviewed) {
        continue;
      }
      if (status === 'reviewed' && !reviewed) {
        continue;
      }
      queue.push({
        submissionId: sub.id,
        result,
        moderatedAt,
        reviewed
      });
    }
    return queue;
  }
  async reviewModeration(tenantId, submissionId, adminUserId, approved, note) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        student: {
          school: {
            tenantId
          }
        }
      }
    });
    if (!submission) {
      throw new _common.NotFoundException(`Submission ${submissionId} not found`);
    }
    const meta = submission.metadata ?? {};
    if (!meta.moderation) {
      throw new _common.NotFoundException(`No moderation record found for submission ${submissionId}`);
    }
    const updatedMeta = {
      ...meta,
      moderation: {
        ...meta.moderation,
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminUserId,
        approved,
        reviewNote: note
      }
    };
    await this.prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        metadata: updatedMeta
      }
    });
    this.logger.log(`Submission ${submissionId} moderation reviewed by ${adminUserId}: ${approved ? 'approved' : 'rejected'}`);
    return {
      success: true
    };
  }
};
exports.ContentModerationService = ContentModerationService = ContentModerationService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], ContentModerationService);