import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CoursesService } from '../../courses/courses.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Course, CoursePage } from '../types/course.types';
import { CreateCourseInput, CourseFilterInput } from '../inputs/course.input';

@Resolver(() => Course)
export class CoursesResolver {
  constructor(private readonly coursesService: CoursesService) {}

  @Query(() => CoursePage, { name: 'courses', description: 'List courses for the authenticated tenant' })
  @UseGuards(GqlAuthGuard)
  async getCourses(
    @Args('filter', { nullable: true }) filter: CourseFilterInput = {},
    @CurrentUser() user: { tenantId: string },
  ): Promise<CoursePage> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const result = await this.coursesService.findAll(user.tenantId, {
      page,
      limit,
      skip: (page - 1) * limit,
      search: filter.search,
      sortBy: 'createdAt',
      sortOrder: 'desc' as any,
    }, { level: filter.level as any, category: filter.category ?? undefined });

    return {
      data: (result as any).items as Course[],
      meta: {
        total: (result as any).total,
        page: (result as any).page,
        totalPages: (result as any).totalPages,
        limit,
      },
    };
  }

  @Query(() => Course, { name: 'course', description: 'Get a single course by ID' })
  @UseGuards(GqlAuthGuard)
  getCourse(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.coursesService.findById(id, user.tenantId);
  }

  @Mutation(() => Course, { name: 'createCourse', description: 'Create a new course' })
  @UseGuards(GqlAuthGuard)
  createCourse(
    @Args('input') input: CreateCourseInput,
    @CurrentUser() user: { id: string; tenantId: string; role: string },
  ) {
    return this.coursesService.create(user.tenantId, user.id, input as any);
  }

  @Mutation(() => Boolean, { name: 'publishCourse', description: 'Publish a course' })
  @UseGuards(GqlAuthGuard)
  async publishCourse(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ): Promise<boolean> {
    await this.coursesService.publish(id, user.tenantId);
    return true;
  }

  @Mutation(() => Boolean, { name: 'deleteCourse', description: 'Delete a course' })
  @UseGuards(GqlAuthGuard)
  async deleteCourse(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ): Promise<boolean> {
    await this.coursesService.delete(id, user.tenantId);
    return true;
  }
}
