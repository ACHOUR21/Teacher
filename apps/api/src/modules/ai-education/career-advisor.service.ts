/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIModuleType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export interface CareerProfile {
  skills: string[];
  interests: string[];
  completedCourses: string[];
  assessmentScores: Record<string, number>;
}

export interface CareerMatch {
  title: string;
  matchScore: number;
  description: string;
  requiredSkills: string[];
}

export interface SkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  recommendedCourses: string[];
}

export interface LearningStep {
  step: number;
  action: string;
  timelineWeeks: number;
}

export interface CareerRecommendation {
  careers: CareerMatch[];
  skillGaps: SkillGap[];
  learningPath: LearningStep[];
}

@Injectable()
export class CareerAdvisorService {
  private readonly logger = new Logger(CareerAdvisorService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key' });
  }

  async buildCareerProfile(userId: string, tenantId: string): Promise<CareerProfile> {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        courseProgress: {
          include: { course: true },
          where: { progressPercent: { gte: 80 } },
        },
      },
    });

    const completedCourses = student?.courseProgress.map((cp: any) => cp.course.title as string) ?? [];

    // Gather quiz/exam scores for assessment data
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const assessmentScores: Record<string, number> = {};
    for (const attempt of quizAttempts as any[]) {
      const title: string = (attempt.quiz as any)?.title ?? 'Unknown Quiz';
      assessmentScores[title] = attempt.score as number;
    }

    // Extract interests from course categories
    const interests: string[] = [];
    if (student?.courseProgress) {
      for (const cp of student.courseProgress as any[]) {
        const category: string | undefined = (cp.course as any)?.category;
        if (category && !interests.includes(category)) {
          interests.push(category);
        }
      }
    }

    // Basic skills inference from completed courses
    const skills = completedCourses.slice(0, 10).map((c: string) => c.split(':')[0].trim());

    return { skills, interests, completedCourses, assessmentScores };
  }

  async getCareerRecommendations(userId: string, tenantId: string): Promise<CareerRecommendation> {
    const profile = await this.buildCareerProfile(userId, tenantId);

    const systemPrompt =
      'You are a career advisor. Given this student profile, recommend top 5 careers with match scores (0-100), ' +
      'identify skill gaps, and create a 12-week learning path. Return only valid JSON.';

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

    let recommendation: CareerRecommendation;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = (msg.content[0] as { type: 'text'; text: string }).text;
      recommendation = JSON.parse(text) as CareerRecommendation;
    } catch (err) {
      this.logger.error('Failed to get career recommendations from Claude', err);
      recommendation = {
        careers: [
          {
            title: 'Software Developer',
            matchScore: 70,
            description: 'Build and maintain software applications.',
            requiredSkills: ['Programming', 'Problem Solving', 'Algorithms'],
          },
        ],
        skillGaps: [
          {
            skill: 'Advanced Programming',
            priority: 'high',
            recommendedCourses: ['Data Structures', 'Algorithms'],
          },
        ],
        learningPath: [
          { step: 1, action: 'Complete foundational programming course', timelineWeeks: 4 },
          { step: 2, action: 'Build a portfolio project', timelineWeeks: 6 },
          { step: 3, action: 'Apply for internships', timelineWeeks: 2 },
        ],
      };
    }

    // Store conversation
    try {
      await this.prisma.aIConversation.create({
        data: {
          tenantId,
          userId,
          module: AIModuleType.CAREER_ADVISOR,
          title: 'Career Recommendations',
          context: { profile, recommendation } as object,
        },
      });
    } catch (err) {
      this.logger.warn('Failed to store career advisor conversation', err);
    }

    return recommendation;
  }
}
