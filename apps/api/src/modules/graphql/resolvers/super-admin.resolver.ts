import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InputType, Field } from '@nestjs/graphql';
import { SuperAdminService } from '../../super-admin/super-admin.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { PlatformOverview, TenantPage, BillingOverview, TenantSummary } from '../types/super-admin.types';
import { UserBrief } from '../types/common.types';

@InputType()
class UpdateTenantInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) plan?: string;
  @Field({ nullable: true }) isActive?: boolean;
  @Field({ nullable: true }) domain?: string;
}

@Resolver()
export class SuperAdminResolver {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Query(() => PlatformOverview, { name: 'platformOverview', description: 'Platform-wide KPIs and recent tenants' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getPlatformOverview(): Promise<PlatformOverview> {
    const data = await this.superAdminService.getPlatformOverview() as any;
    return {
      kpis: {
        totalTenants: data.kpis.totalTenants,
        totalUsers: data.kpis.totalUsers,
        totalCourses: data.kpis.totalCourses,
        totalEnrollments: data.kpis.totalEnrollments,
        totalRevenue: data.kpis.totalRevenue ?? 0,
        activeTenants: data.kpis.activeTenants,
      },
      recentTenants: data.recentTenants.map((t: any) => ({
        ...t,
        userCount: t._count?.users ?? 0,
        courseCount: t._count?.courses ?? 0,
      })),
    };
  }

  @Query(() => TenantPage, { name: 'tenants', description: 'List all tenants (SUPER_ADMIN only)' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getTenants(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('search', { nullable: true }) search?: string,
  ): Promise<TenantPage> {
    const result = await this.superAdminService.getTenants(page, limit, search) as any;
    return {
      items: result.items.map((t: any) => ({
        ...t,
        userCount: t._count?.users ?? 0,
        courseCount: t._count?.courses ?? 0,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Query(() => BillingOverview, { name: 'platformBilling', description: 'Platform-wide billing overview (SUPER_ADMIN only)' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getBillingOverview(): Promise<BillingOverview> {
    const data = await this.superAdminService.getBillingOverview() as any;
    return {
      totalRevenue: data.totalRevenue ?? 0,
      totalInvoices: data.subscriptionStats?.total ?? 0,
    };
  }

  @Mutation(() => TenantSummary, { name: 'updateTenant', description: 'Update tenant details (SUPER_ADMIN only)' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateTenant(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTenantInput,
  ): Promise<TenantSummary> {
    const result = await this.superAdminService.updateTenant(id, input as any) as any;
    return { ...result, userCount: 0, courseCount: 0 };
  }

  @Mutation(() => Boolean, { name: 'deleteTenant', description: 'Delete a tenant and all its data (SUPER_ADMIN only)' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteTenant(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.superAdminService.deleteTenant(id);
    return true;
  }

  @Mutation(() => String, { name: 'impersonateUser', description: 'Get impersonation token for a user (SUPER_ADMIN only)' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async impersonateUser(@Args('userId', { type: () => ID }) userId: string): Promise<string> {
    const result = await this.superAdminService.impersonate(userId) as any;
    return result.token;
  }
}
