import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class PlatformStats {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalCourses: number;

  @Field(() => Int)
  activeSessions: number;

  @Field(() => Float)
  totalRevenue: number;
}

@ObjectType()
export class DailyGrowth {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class StudentActivity {
  @Field(() => Int)
  activeStudents: number;

  @Field(() => Int)
  completions: number;

  @Field(() => Int)
  submissions: number;
}

@ObjectType()
export class MonthlyRevenue {
  @Field()
  month: string;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class AIModuleUsage {
  @Field()
  module: string;

  @Field(() => Int)
  requestCount: number;

  @Field(() => Int)
  totalTokens: number;

  @Field(() => Float)
  totalCost: number;
}
