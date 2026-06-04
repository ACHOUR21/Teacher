import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService, UpdateUserDto, UpdateUserProfileDto } from '../../users.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { PaginationDto } from '../../../core/pagination/pagination.dto';
import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AssignRoleDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users in current tenant (paginated)' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('role') roleFilter?: UserRole,
  ) {
    return this.usersService.findAll(tenantId, pagination, roleFilter);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: CurrentUserPayload, @TenantId() tenantId: string) {
    return this.usersService.findById(user.id, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.usersService.findById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user details' })
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, tenantId, dto);
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user extended profile' })
  updateProfile(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate user' })
  delete(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.delete(id, tenantId, currentUser);
  }

  @Post(':id/roles')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.assignRole(id, tenantId, dto.role, currentUser);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity log' })
  getActivity(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.usersService.getUserActivity(id, tenantId);
  }
}
