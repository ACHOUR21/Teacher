import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RecommendationEngineService } from './recommendation-engine.service';

@ApiTags('AI Recommendations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai/recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationEngineService,
  ) {}

  /**
   * GET /ai/recommendations
   * Get personalized course recommendations for the authenticated user.
   */
  @Get()
  @ApiOperation({ summary: 'Get personalized course recommendations' })
  getRecommendations(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.recommendationService.getRecommendations(userId, tenantId, parsedLimit);
  }

  /**
   * GET /ai/recommendations/feed
   * Get a personalized feed with recommendations, trending, and new courses.
   */
  @Get('feed')
  @ApiOperation({ summary: 'Get personalized feed (recommendations, trending, new)' })
  getPersonalizedFeed(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.recommendationService.getPersonalizedFeed(userId, tenantId);
  }

  /**
   * GET /ai/recommendations/popular
   * Get the most popular courses in the tenant.
   */
  @Get('popular')
  @ApiOperation({ summary: 'Get popular courses in tenant' })
  getPopularCourses(
    @CurrentUser('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.recommendationService.getPopularCourses(tenantId, parsedLimit);
  }

  /**
   * GET /ai/recommendations/similar/:courseId
   * Get courses similar to the given course.
   */
  @Get('similar/:courseId')
  @ApiOperation({ summary: 'Get courses similar to a given course' })
  getSimilarCourses(
    @Param('courseId') courseId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.recommendationService.getSimilarCourses(courseId, tenantId, parsedLimit);
  }
}
