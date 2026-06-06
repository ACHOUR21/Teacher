import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class TenantSummary {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  plan: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  domain?: string;

  @Field()
  createdAt: Date;

  @Field(() => Int)
  userCount: number;

  @Field(() => Int)
  courseCount: number;
}

@ObjectType()
export class TenantPage {
  @Field(() => [TenantSummary])
  items: TenantSummary[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class PlatformKPI {
  @Field(() => Int)
  totalTenants: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalCourses: number;

  @Field(() => Int)
  totalEnrollments: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Int)
  activeTenants: number;
}

@ObjectType()
export class PlatformOverview {
  @Field(() => PlatformKPI)
  kpis: PlatformKPI;

  @Field(() => [TenantSummary])
  recentTenants: TenantSummary[];
}

@ObjectType()
export class BillingOverview {
  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Int)
  totalInvoices: number;
}
