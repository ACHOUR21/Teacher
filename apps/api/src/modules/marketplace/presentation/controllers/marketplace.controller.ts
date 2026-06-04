import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { MarketplaceService } from '../../marketplace.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { Public } from '../../../core/decorators/public.decorator';

class AddReviewDto {
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() comment?: string;
}

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('courses')
  @Public()
  @ApiOperation({ summary: 'Browse marketplace courses' })
  browse(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('maxPrice') maxPrice?: number,
    @Query('minRating') minRating?: number,
    @Query('sortBy') sortBy?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.marketplaceService.browseCourses({ search, category, level, maxPrice: maxPrice ? +maxPrice : undefined, minRating: minRating ? +minRating : undefined, sortBy, page: +page, limit: +limit });
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get course categories with counts' })
  categories() {
    return this.marketplaceService.getCategories();
  }

  @Post('courses/:id/purchase')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Purchase or enroll in a course' })
  purchase(@Param('id') courseId: string, @CurrentUser() user: any) {
    return this.marketplaceService.purchaseCourse(user.id, courseId);
  }

  @Post('courses/:id/reviews')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a course review' })
  addReview(@Param('id') courseId: string, @CurrentUser() user: any, @Body() dto: AddReviewDto) {
    return this.marketplaceService.addReview(user.id, courseId, dto.rating, dto.comment);
  }

  @Get('courses/:id/reviews')
  @Public()
  @ApiOperation({ summary: 'Get course reviews' })
  reviews(@Param('id') courseId: string, @Query('page') page = 1) {
    return this.marketplaceService.getCourseReviews(courseId, +page);
  }
}
