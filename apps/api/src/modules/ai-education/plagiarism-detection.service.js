"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PlagiarismDetectionService = void 0;
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
var PlagiarismDetectionService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let PlagiarismDetectionService = exports.PlagiarismDetectionService = PlagiarismDetectionService_1 = class PlagiarismDetectionService {
  logger = new _common.Logger(PlagiarismDetectionService_1.name);
  client;
  constructor(prisma) {
    this.prisma = prisma;
    this.client = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  /**
   * Standard dynamic-programming Levenshtein distance.
   * Strings are truncated to 500 chars for performance.
   */
  levenshteinDistance(a, b) {
    const s1 = a.substring(0, 500);
    const s2 = b.substring(0, 500);
    const m = s1.length;
    const n = s2.length;
    // dp[i][j] = edit distance between s1[0..i-1] and s2[0..j-1]
    const dp = Array.from({
      length: m + 1
    }, (_, i) => Array.from({
      length: n + 1
    }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j],
          // deletion
          dp[i][j - 1],
          // insertion
          dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }
  levenshteinSimilarity(a, b) {
    if (!a && !b) {
      return 1;
    }
    if (!a || !b) {
      return 0;
    }
    const maxLength = Math.max(Math.min(a.length, 500), Math.min(b.length, 500));
    if (maxLength === 0) {
      return 1;
    }
    const dist = this.levenshteinDistance(a, b);
    return 1 - dist / maxLength;
  }
  async detectAiGenerated(text) {
    try {
      const msg = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze this text and estimate the probability it was AI-generated (0-1). ` + `Return JSON: { "probability": number, "indicators": string[] }\n\nText:\n${text.substring(0, 3000)}`
        }]
      });
      const raw = msg.content[0].text;
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(jsonText);
    } catch (err) {
      this.logger.error('AI detection failed', err);
      return {
        probability: 0,
        indicators: []
      };
    }
  }
  async checkPlagiarism(submissionId, tenantId) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        student: {
          school: {
            tenantId
          }
        }
      },
      include: {
        assignment: true
      }
    });
    if (!submission) {
      throw new _common.NotFoundException(`Submission ${submissionId} not found`);
    }
    const content = submission.content ?? '';
    // Fetch other submissions for the same assignment (excluding this one)
    const otherSubmissions = await this.prisma.submission.findMany({
      where: {
        assignmentId: submission.assignmentId,
        id: {
          not: submissionId
        }
      },
      select: {
        id: true,
        content: true
      }
    });
    // Compare against other submissions
    const suspiciousSegments = [];
    let maxSimilarity = 0;
    for (const other of otherSubmissions) {
      const otherContent = other.content ?? '';
      if (!otherContent) {
        continue;
      }
      const similarity = this.levenshteinSimilarity(content, otherContent);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
      if (similarity > 0.5) {
        // Find the overlapping window (simple: report the first 200 chars)
        const snip = content.substring(0, 200);
        suspiciousSegments.push({
          text: snip,
          startIndex: 0,
          endIndex: Math.min(content.length, 200),
          similarity
        });
      }
    }
    // Detect AI-generated probability
    const aiDetection = await this.detectAiGenerated(content);
    const aiGeneratedProbability = aiDetection.probability;
    // Determine risk
    let plagiarismRisk = 'low';
    if (maxSimilarity > 0.7 || aiGeneratedProbability > 0.8) {
      plagiarismRisk = 'high';
    } else if (maxSimilarity > 0.5 || aiGeneratedProbability > 0.5) {
      plagiarismRisk = 'medium';
    }
    const originalityScore = Math.max(0, 1 - maxSimilarity);
    const reportLines = [`Plagiarism check for submission ${submissionId}`, `Originality score: ${(originalityScore * 100).toFixed(1)}%`, `Risk level: ${plagiarismRisk}`, `AI-generated probability: ${(aiGeneratedProbability * 100).toFixed(1)}%`];
    if (aiDetection.indicators.length > 0) {
      reportLines.push(`AI indicators: ${aiDetection.indicators.join(', ')}`);
    }
    if (suspiciousSegments.length > 0) {
      reportLines.push(`${suspiciousSegments.length} suspicious segment(s) found with similarity > 50%.`);
    }
    const report = {
      submissionId,
      originalityScore,
      plagiarismRisk,
      suspiciousSegments,
      aiGeneratedProbability,
      report: reportLines.join('\n')
    };
    // Persist to submission metadata
    const existingMeta = submission.metadata ?? {};
    const updatedMeta = {
      ...existingMeta,
      plagiarism: {
        report,
        checkedAt: new Date().toISOString()
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
    if (plagiarismRisk === 'high') {
      this.logger.warn(`High plagiarism risk detected for submission ${submissionId}: maxSimilarity=${maxSimilarity.toFixed(2)}, aiProb=${aiGeneratedProbability.toFixed(2)}`);
    }
    return report;
  }
  async getBatchReport(tenantId, assignmentId) {
    const submissions = await this.prisma.submission.findMany({
      where: {
        assignmentId,
        student: {
          school: {
            tenantId
          }
        }
      },
      select: {
        id: true
      }
    });
    if (submissions.length === 0) {
      return [];
    }
    const reports = [];
    for (const sub of submissions) {
      try {
        const report = await this.checkPlagiarism(sub.id, tenantId);
        reports.push(report);
      } catch (err) {
        this.logger.error(`Failed to check plagiarism for submission ${sub.id}`, err);
      }
    }
    return reports;
  }
};
exports.PlagiarismDetectionService = PlagiarismDetectionService = PlagiarismDetectionService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], PlagiarismDetectionService);