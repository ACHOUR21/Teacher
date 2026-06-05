import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { User, UserPage } from '../types/user.types';
import { UserRole } from '@prisma/client';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me', description: 'Get current authenticated user' })
  @UseGuards(GqlAuthGuard)
  async getMe(
    @CurrentUser() user: { id: string; tenantId: string },
  ): Promise<User> {
    return this.usersService.findById(user.id, user.tenantId) as Promise<User>;
  }

  @Query(() => UserPage, { name: 'users', description: 'List users in the tenant' })
  @UseGuards(GqlAuthGuard)
  async getUsers(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('search', { type: () => String, nullable: true }) search: string | undefined,
    @Args('role', { type: () => String, nullable: true }) role: string | undefined,
    @CurrentUser() user: { tenantId: string },
  ): Promise<UserPage> {
    const result = await this.usersService.findAll(
      user.tenantId,
      { page, limit, skip: (page - 1) * limit, search, sortBy: 'createdAt', sortOrder: 'desc' as any },
      role as UserRole | undefined,
    );
    return {
      data: (result as any).items as User[],
      meta: {
        total: (result as any).total,
        page: (result as any).page,
        totalPages: (result as any).totalPages,
        limit,
      },
    };
  }

  @Query(() => User, { name: 'user', description: 'Get a user by ID' })
  @UseGuards(GqlAuthGuard)
  async getUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { tenantId: string },
  ): Promise<User> {
    return this.usersService.findById(id, user.tenantId) as Promise<User>;
  }

  @Mutation(() => User, { name: 'assignRole', description: 'Assign a role to a user (ADMIN+)' })
  @UseGuards(GqlAuthGuard)
  async assignRole(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role') role: string,
    @CurrentUser() user: { tenantId: string; role: UserRole },
  ): Promise<User> {
    return this.usersService.assignRole(
      userId,
      user.tenantId,
      role as UserRole,
      { role: user.role },
    ) as Promise<User>;
  }

  @Mutation(() => Boolean, { name: 'deactivateUser', description: 'Deactivate a user account' })
  @UseGuards(GqlAuthGuard)
  async deactivateUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { id: string; tenantId: string; role: UserRole },
  ): Promise<boolean> {
    await this.usersService.delete(id, user.tenantId, { id: user.id, role: user.role });
    return true;
  }
}
