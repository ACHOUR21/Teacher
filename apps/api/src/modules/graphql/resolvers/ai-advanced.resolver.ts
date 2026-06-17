/* eslint-disable @typescript-eslint/no-unsafe-return */
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args } from '@nestjs/graphql';

import { CareerAdvisorService } from '../../ai-education/career-advisor.service';
import { MindMapService } from '../../ai-education/mind-map.service';
import { PerformancePredictionService } from '../../ai-education/performance-prediction.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import {
  CareerRecommendationType,
  MindMapResultType,
  PerformancePredictionType,
} from '../types/ai-advanced.types';

@Resolver()
export class AiAdvancedResolver {
  constructor(
    private readonly mindMapService: MindMapService,
    private readonly careerAdvisorService: CareerAdvisorService,
    private readonly performancePredictionService: PerformancePredictionService,
  ) {}

  @Query(() => MindMapResultType, { name: 'generateMindMap', description: 'Generate an AI mind map for a topic' })
  @UseGuards(GqlAuthGuard)
  async generateMindMap(
    @Args('topic') topic: string,
    @Args('depth', { nullable: true, defaultValue: 'deep' }) depth: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ): Promise<MindMapResultType> {
    const result = await this.mindMapService.generateMindMap(
      user.id,
      user.tenantId,
      topic,
      depth as 'shallow' | 'deep',
    );
    return result as unknown as MindMapResultType;
  }

  @Query(() => CareerRecommendationType, { name: 'getCareerRecommendations', description: 'Get AI career recommendations for the current user' })
  @UseGuards(GqlAuthGuard)
  async getCareerRecommendations(
    @CurrentUser() user: { id: string; tenantId: string },
  ): Promise<CareerRecommendationType> {
    const result = await this.careerAdvisorService.getCareerRecommendations(user.id, user.tenantId);
    return result as unknown as CareerRecommendationType;
  }

  @Query(() => PerformancePredictionType, { name: 'predictMyPerformance', description: 'Predict performance for the current student' })
  @UseGuards(GqlAuthGuard)
  async predictMyPerformance(
    @CurrentUser() user: { id: string; tenantId: string },
    @Args('courseId', { nullable: true }) _courseId?: string,
  ): Promise<PerformancePredictionType> {
    const studentId =
      (await this.performancePredictionService.findStudentIdByUserId(user.id)) ?? user.id;
    const result = await this.performancePredictionService.predictPerformance(studentId, user.tenantId);
    return result as unknown as PerformancePredictionType;
  }
}
