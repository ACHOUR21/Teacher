import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

import { PaginationMeta } from './common.types';

@ObjectType()
export class AssignmentGql {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field(() => Float, { nullable: true })
  maxScore?: number;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lessonId?: string;

  @Field({ nullable: true })
  teacherId?: string;
}

@ObjectType()
export class AssignmentPage {
  @Field(() => [AssignmentGql])
  data: AssignmentGql[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}

@ObjectType()
export class AssignmentSubmissionGql {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  assignmentId: string;

  @Field(() => ID)
  studentId: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => Float, { nullable: true })
  score?: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field()
  createdAt: Date;
}
