import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CoursesService } from '../../courses/courses.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
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
    }, filter.level as any, filter.category);

    return {
      data: result.data as Course[],
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit,
      },
    };
  }

  @Query(() => Course, { name: 'course', description: 'Get a single course by ID' })
  @UseGuards(GqlAuthGuard)
  async getCourse(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { tenantId: string },
  ): Promise<Course> {
    return this.coursesService.findOne(user.tenantId, id) as Promise<Course>;
  }

  @Mutation(() => Course, { name: 'createCourse', description: 'Create a new course' })
  @UseGuards(GqlAuthGuard)
  async createCourse(
    @Args('input') input: CreateCourseInput,
    @CurrentUser() user: { id: string; tenantId: string; role: string },
  ): Promise<Course> {
    return this.coursesService.create(user.tenantId, user.id, input as any) as Promise<Course>;
  }

  @Mutation(() => Boolean, { name: 'publishCourse', description: 'Publish or unpublish a course' })
  @UseGuards(GqlAuthGuard)
  async publishCourse(
    @Args('id', { type: () => ID }) id: string,
    @Args('published') published: boolean,
    @CurrentUser() user: { id: string; tenantId: string; role: string },
  ): Promise<boolean> {
    await this.coursesService.publish(user.tenantId, id, user.id, user.role as any);
    return true;
  }

  @Mutation(() => Boolean, { name: 'deleteCourse', description: 'Delete a course' })
  @UseGuards(GqlAuthGuard)
  async deleteCourse(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { id: string; tenantId: string; role: string },
  ): Promise<boolean> {
    await this.coursesService.delete(user.tenantId, id, user.id, user.role as any);
    return true;
  }
}
