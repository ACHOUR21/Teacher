import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';
import { PaginationMeta, UserBrief } from './common.types';

@ObjectType()
export class CourseSection {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => Int)
  order: number;
}

@ObjectType()
export class Course {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  thumbnailUrl?: string;

  @Field({ nullable: true })
  category?: string;

  @Field()
  level: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int)
  enrollCount: number;

  @Field(() => Int)
  totalLessons: number;

  @Field(() => Int)
  durationMinutes: number;

  @Field()
  isPublished: boolean;

  @Field({ nullable: true })
  language?: string;

  @Field(() => [String])
  tags: string[];

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  teacher?: UserBrief;
}

@ObjectType()
export class CoursePage {
  @Field(() => [Course])
  data: Course[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
