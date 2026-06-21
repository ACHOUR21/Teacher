"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CareerAdvisorService = void 0;
var _common = require("@nestjs/common");
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _client = require("@prisma/client");
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
var CareerAdvisorService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let CareerAdvisorService = exports.CareerAdvisorService = CareerAdvisorService_1 = class CareerAdvisorService {
  logger = new _common.Logger(CareerAdvisorService_1.name);
  anthropic;
  constructor(prisma) {
    this.prisma = prisma;
    this.anthropic = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  async buildCareerProfile(userId, tenantId) {
    const student = await this.prisma.student.findFirst({
      where: {
        userId
      },
      include: {
        courseProgress: {
          include: {
            course: true
          },
          where: {
            progressPercent: {
              gte: 80
            }
          }
        }
      }
    });
    const completedCourses = student?.courseProgress.map(cp => cp.course.title) ?? [];
    // Gather quiz/exam scores for assessment data
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId
      },
      include: {
        quiz: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    const assessmentScores = {};
    for (const attempt of quizAttempts) {
      const title = attempt.quiz?.title ?? 'Unknown Quiz';
      assessmentScores[title] = attempt.score;
    }
    // Extract interests from course categories
    const interests = [];
    if (student?.courseProgress) {
      for (const cp of student.courseProgress) {
        const category = cp.course?.category;
        if (category && !interests.includes(category)) {
          interests.push(category);
        }
      }
    }
    // Basic skills inference from completed courses
    const skills = completedCourses.slice(0, 10).map(c => c.split(':')[0].trim());
    return {
      skills,
      interests,
      completedCourses,
      assessmentScores
    };
  }
  async getCareerRecommendations(userId, tenantId) {
    const profile = await this.buildCareerProfile(userId, tenantId);
    const systemPrompt = 'You are a career advisor. Given this student profile, recommend top 5 careers with match scores (0-100), ' + 'identify skill gaps, and create a 12-week learning path. Return only valid JSON.';
    const userPrompt = `Student Profile:
Completed Courses: ${profile.completedCourses.join(', ') || 'None'}
Skills: ${profile.skills.join(', ') || 'None identified'}
Interests: ${profile.interests.join(', ') || 'General'}
Assessment Scores: ${JSON.stringify(profile.assessmentScores)}

Return JSON matching this structure exactly:
{
  "careers": [{ "title": string, "matchScore": number, "description": string, "requiredSkills": string[] }],
  "skillGaps": [{ "skill": string, "priority": "high"|"medium"|"low", "recommendedCourses": string[] }],
  "learningPath": [{ "step": number, "action": string, "timelineWeeks": number }]
}`;
    let recommendation;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });
      const text = msg.content[0].text;
      recommendation = JSON.parse(text);
    } catch (err) {
      this.logger.error('Failed to get career recommendations from Claude', err);
      recommendation = {
        careers: [{
          title: 'Software Developer',
          matchScore: 70,
          description: 'Build and maintain software applications.',
          requiredSkills: ['Programming', 'Problem Solving', 'Algorithms']
        }],
        skillGaps: [{
          skill: 'Advanced Programming',
          priority: 'high',
          recommendedCourses: ['Data Structures', 'Algorithms']
        }],
        learningPath: [{
          step: 1,
          action: 'Complete foundational programming course',
          timelineWeeks: 4
        }, {
          step: 2,
          action: 'Build a portfolio project',
          timelineWeeks: 6
        }, {
          step: 3,
          action: 'Apply for internships',
          timelineWeeks: 2
        }]
      };
    }
    // Store conversation
    try {
      await this.prisma.aIConversation.create({
        data: {
          tenantId,
          userId,
          module: _client.AIModuleType.CAREER_ADVISOR,
          title: 'Career Recommendations',
          context: {
            profile,
            recommendation
          }
        }
      });
    } catch (err) {
      this.logger.warn('Failed to store career advisor conversation', err);
    }
    return recommendation;
  }
};
exports.CareerAdvisorService = CareerAdvisorService = CareerAdvisorService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], CareerAdvisorService);