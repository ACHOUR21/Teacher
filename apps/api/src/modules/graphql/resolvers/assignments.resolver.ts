import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID, Int, Float , InputType, Field } from '@nestjs/graphql';

import { AssignmentsService } from '../../assignments/assignments.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { AssignmentGql, AssignmentPage, AssignmentSubmissionGql } from '../types/assignment.types';

@InputType()
class CreateAssignmentInput {
  @Field() title: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) lessonId?: string;
  @Field({ nullable: true }) dueDate?: string;
  @Field(() => Float, { nullable: true }) maxScore?: number;
}

@InputType()
class GradeSubmissionInput {
  @Field(() => Float) score: number;
  @Field({ nullable: true }) feedback?: string;
}

@Resolver(() => AssignmentGql)
export class AssignmentsResolver {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Query(() => AssignmentPage, { name: 'assignments', description: 'List assignments (teacher sees all, student sees own)' })
  @UseGuards(GqlAuthGuard)
  async getAssignments(
    @CurrentUser() user: any,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<AssignmentPage> {
    const isTeacher = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);
    const result = await this.assignmentsService.findAll(
      isTeacher ? user.id : undefined,
      !isTeacher ? user.id : undefined,
    ) as any[];

    const start = (page - 1) * limit;
    const paged = result.slice(start, start + limit);
    return {
      data: paged,
      meta: { total: result.length, page, totalPages: Math.ceil(result.length / limit), limit },
    };
  }

  @Query(() => [AssignmentGql], { name: 'myAssignments', description: 'Get assignments for the current student' })
  @UseGuards(GqlAuthGuard)
  async getMyAssignments(@CurrentUser() user: any): Promise<AssignmentGql[]> {
    return this.assignmentsService.getStudentAssignments(user.id) as any;
  }

  @Query(() => AssignmentGql, { name: 'assignment', nullable: true, description: 'Get a single assignment by ID' })
  @UseGuards(GqlAuthGuard)
  async getAssignment(@Args('id', { type: () => ID }) id: string): Promise<AssignmentGql | null> {
    return this.assignmentsService.findById(id) as any;
  }

  @Query(() => [AssignmentSubmissionGql], { name: 'assignmentSubmissions', description: 'Get all submissions for an assignment' })
  @UseGuards(GqlAuthGuard)
  async getSubmissions(
    @Args('assignmentId', { type: () => ID }) assignmentId: string,
    @CurrentUser() user: any,
  ): Promise<AssignmentSubmissionGql[]> {
    return this.assignmentsService.getSubmissions(assignmentId, user.id) as any;
  }

  @Mutation(() => AssignmentGql, { name: 'createAssignment', description: 'Create a new assignment (teacher)' })
  @UseGuards(GqlAuthGuard)
  async createAssignment(
    @Args('input') input: CreateAssignmentInput,
    @CurrentUser() user: any,
  ): Promise<AssignmentGql> {
    return this.assignmentsService.create(user.id, input as any) as any;
  }

  @Mutation(() => AssignmentSubmissionGql, { name: 'submitAssignment', description: 'Submit an assignment (student)' })
  @UseGuards(GqlAuthGuard)
  async submitAssignment(
    @Args('assignmentId', { type: () => ID }) assignmentId: string,
    @Args('content', { nullable: true }) content: string,
    @CurrentUser() user: any,
  ): Promise<AssignmentSubmissionGql> {
    return this.assignmentsService.submit(assignmentId, user.id, { content }) as any;
  }

  @Mutation(() => AssignmentSubmissionGql, { name: 'gradeSubmission', description: 'Grade a student submission (teacher)' })
  @UseGuards(GqlAuthGuard)
  async gradeSubmission(
    @Args('submissionId', { type: () => ID }) submissionId: string,
    @Args('input') input: GradeSubmissionInput,
    @CurrentUser() user: any,
  ): Promise<AssignmentSubmissionGql> {
    return this.assignmentsService.grade(submissionId, user.id, input) as any;
  }

  @Mutation(() => Boolean, { name: 'deleteAssignment', description: 'Delete an assignment (teacher)' })
  @UseGuards(GqlAuthGuard)
  async deleteAssignment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    await this.assignmentsService.delete(id, user.id);
    return true;
  }
}
