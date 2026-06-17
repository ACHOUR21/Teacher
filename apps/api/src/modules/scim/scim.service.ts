import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';
import {
  ScimUser,
  ScimGroup,
  ScimListResponse,
  ScimUserDto,
  ScimGroupDto,
  ScimPatchOp,
} from './dto/scim.dto';

@Injectable()
export class ScimService {
  private readonly logger = new Logger(ScimService.name);

  constructor(private prisma: PrismaService) {}

  // ─── User Operations ──────────────────────────────────────────────────────

  async listUsers(
    tenantId: string,
    filter?: string,
    startIndex = 1,
    count = 100,
  ): Promise<ScimListResponse<ScimUser>> {
    const skip = Math.max(0, startIndex - 1);
    const take = Math.min(count, 200);

    const where: Prisma.UserWhereInput = { tenantId };

    // Parse simple SCIM filters: userName eq "value" or email eq "value"
    if (filter) {
      const userNameMatch = filter.match(/userName\s+eq\s+"([^"]+)"/i);
      const emailMatch = filter.match(/emails?\s+eq\s+"([^"]+)"/i);
      if (userNameMatch?.[1]) {
        where.email = { equals: userNameMatch[1], mode: 'insensitive' };
      } else if (emailMatch?.[1]) {
        where.email = { equals: emailMatch[1], mode: 'insensitive' };
      }
    }

    const [users, totalResults] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: users.length,
      Resources: users.map((u) => this.toScimUser(u, tenantId)),
    };
  }

  async getUser(tenantId: string, scimId: string): Promise<ScimUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: scimId, tenantId },
    });
    if (!user) {
      throw new NotFoundException(`User ${scimId} not found`);
    }
    return this.toScimUser(user, tenantId);
  }

  async createUser(tenantId: string, dto: ScimUserDto): Promise<ScimUser> {
    const email = this.extractEmail(dto);
    const { firstName, lastName } = this.extractName(dto);

    // Check if user already exists in this tenant
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: { equals: email, mode: 'insensitive' } },
    });

    if (existing) {
      // Link: update with externalId and mark SCIM-managed
      const linked = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          scimExternalId: dto.externalId ?? null,
          scimManaged: true,
          emailVerified: true,
          isActive: dto.active !== false,
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
        },
      });
      this.logger.log(`SCIM: linked existing user ${linked.id} in tenant ${tenantId}`);
      return this.toScimUser(linked, tenantId);
    }

    // Create new user — IdP is authoritative, so emailVerified = true
    const tempPasswordHash = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      10,
    );

    const created = await this.prisma.user.create({
      data: {
        tenantId,
        email: email.toLowerCase(),
        passwordHash: tempPasswordHash,
        firstName: firstName || 'Unknown',
        lastName: lastName || 'User',
        emailVerified: true,
        isActive: dto.active !== false,
        role: UserRole.STUDENT,
        scimExternalId: dto.externalId ?? null,
        scimManaged: true,
      },
    });

    this.logger.log(`SCIM: provisioned new user ${created.id} in tenant ${tenantId}`);
    return this.toScimUser(created, tenantId);
  }

  async replaceUser(
    tenantId: string,
    scimId: string,
    dto: ScimUserDto,
  ): Promise<ScimUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: scimId, tenantId },
    });
    if (!user) {
      throw new NotFoundException(`User ${scimId} not found`);
    }

    const email = this.extractEmail(dto);
    const { firstName, lastName } = this.extractName(dto);

    // Check email uniqueness when changing email
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          tenantId,
          email: { equals: email, mode: 'insensitive' },
          id: { not: scimId },
        },
      });
      if (conflict) {
        throw new ConflictException(`Email ${email} already in use`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: scimId },
      data: {
        email: email.toLowerCase(),
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        isActive: dto.active !== false,
        scimExternalId: dto.externalId ?? user.scimExternalId,
        scimManaged: true,
        emailVerified: true,
      },
    });

    return this.toScimUser(updated, tenantId);
  }

  async patchUser(
    tenantId: string,
    scimId: string,
    operations: ScimPatchOp[],
  ): Promise<ScimUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: scimId, tenantId },
    });
    if (!user) {
      throw new NotFoundException(`User ${scimId} not found`);
    }

    const updateData: Prisma.UserUpdateInput = {};

    for (const op of operations) {
      const opLower = op.op.toLowerCase() as 'add' | 'remove' | 'replace';
      const path = op.path?.toLowerCase();

      if (path === 'active' || (!path && this.extractValueKey(op.value, 'active') !== undefined)) {
        const activeVal =
          path === 'active'
            ? op.value
            : this.extractValueKey(op.value, 'active');
        if (opLower === 'remove') {
          updateData.isActive = false;
        } else {
          updateData.isActive = Boolean(activeVal);
        }
      }

      if (path === 'username' || path === 'username eq') {
        if (opLower !== 'remove' && op.value) {
          updateData.email = String(op.value).toLowerCase();
        }
      }

      if (path === 'name.givenname' || path === 'givenname') {
        if (opLower !== 'remove' && op.value) {
          updateData.firstName = String(op.value);
        }
      }

      if (path === 'name.familyname' || path === 'familyname') {
        if (opLower !== 'remove' && op.value) {
          updateData.lastName = String(op.value);
        }
      }

      // Handle multi-value patch: { op: "replace", value: { active: false } }
      if (!path && op.value && typeof op.value === 'object') {
        const val = op.value as Record<string, unknown>;
        if (val['active'] !== undefined) {
          updateData.isActive = Boolean(val['active']);
        }
        if (val['userName']) {
          updateData.email = String(val['userName']).toLowerCase();
        }
        if (val['externalId'] !== undefined) {
          updateData.scimExternalId = val['externalId'] ? String(val['externalId']) : null;
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: scimId },
      data: updateData,
    });

    return this.toScimUser(updated, tenantId);
  }

  async deleteUser(tenantId: string, scimId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: scimId, tenantId },
    });
    if (!user) {
      throw new NotFoundException(`User ${scimId} not found`);
    }

    // Soft-delete: preserve audit trail
    await this.prisma.user.update({
      where: { id: scimId },
      data: { isActive: false },
    });

    this.logger.log(`SCIM: deprovisioned user ${scimId} in tenant ${tenantId}`);
  }

  // ─── Group Operations ─────────────────────────────────────────────────────

  async listGroups(
    tenantId: string,
    filter?: string,
    startIndex = 1,
    count = 100,
  ): Promise<ScimListResponse<ScimGroup>> {
    const skip = Math.max(0, startIndex - 1);
    const take = Math.min(count, 200);

    // Groups are virtual — derived from distinct roles in this tenant
    const roleGroups = await this.buildVirtualGroups(tenantId);

    // Simple filter support: displayName eq "teachers"
    let filtered = roleGroups;
    if (filter) {
      const nameMatch = filter.match(/displayName\s+eq\s+"([^"]+)"/i);
      if (nameMatch?.[1]) {
        filtered = roleGroups.filter(
          (g) => g.displayName.toLowerCase() === nameMatch[1].toLowerCase(),
        );
      }
    }

    const totalResults = filtered.length;
    const page = filtered.slice(skip, skip + take);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: page.length,
      Resources: page,
    };
  }

  async getGroup(tenantId: string, scimId: string): Promise<ScimGroup> {
    const groups = await this.buildVirtualGroups(tenantId);
    const group = groups.find((g) => g.id === scimId);
    if (!group) {
      throw new NotFoundException(`Group ${scimId} not found`);
    }
    return group;
  }

  async createGroup(tenantId: string, dto: ScimGroupDto): Promise<ScimGroup> {
    const role = this.groupNameToRole(dto.displayName);

    // Add members to the role group
    if (dto.members && dto.members.length > 0) {
      await Promise.all(
        dto.members.map(async (member) => {
          const user = await this.prisma.user.findFirst({
            where: { id: member.value, tenantId },
          });
          if (user) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { role },
            });
          }
        }),
      );
    }

    const groupId = this.roleToGroupId(tenantId, role);
    return this.buildGroupResponse(tenantId, groupId, dto.displayName, role);
  }

  async replaceGroup(
    tenantId: string,
    scimId: string,
    dto: ScimGroupDto,
  ): Promise<ScimGroup> {
    const role = this.groupNameToRole(dto.displayName);

    // Determine which users should be in this group
    const newMemberIds = (dto.members ?? []).map((m) => m.value);

    // Get current members of this role group
    const currentMembers = await this.prisma.user.findMany({
      where: { tenantId, role },
      select: { id: true },
    });
    const currentMemberIds = currentMembers.map((u) => u.id);

    // Add new members
    const toAdd = newMemberIds.filter((id) => !currentMemberIds.includes(id));
    // Remove members no longer in group (demote to STUDENT)
    const toRemove = currentMemberIds.filter((id) => !newMemberIds.includes(id));

    await Promise.all([
      ...toAdd.map((userId) =>
        this.prisma.user.updateMany({
          where: { id: userId, tenantId },
          data: { role },
        }),
      ),
      ...toRemove.map((userId) =>
        this.prisma.user.updateMany({
          where: { id: userId, tenantId, role },
          data: { role: UserRole.STUDENT },
        }),
      ),
    ]);

    return this.buildGroupResponse(tenantId, scimId, dto.displayName, role);
  }

  async deleteGroup(tenantId: string, scimId: string): Promise<void> {
    // Virtual groups cannot be truly deleted — demote all members to STUDENT
    const groups = await this.buildVirtualGroups(tenantId);
    const group = groups.find((g) => g.id === scimId);
    if (!group) {
      throw new NotFoundException(`Group ${scimId} not found`);
    }

    const role = this.groupNameToRole(group.displayName);
    if (role !== UserRole.STUDENT) {
      await this.prisma.user.updateMany({
        where: { tenantId, role },
        data: { role: UserRole.STUDENT },
      });
    }

    this.logger.log(`SCIM: deleted group ${scimId} (role ${role}) in tenant ${tenantId}`);
  }

  // ─── SCIM Token Management ────────────────────────────────────────────────

  async generateScimToken(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(plainToken, 10);

    const settings = (tenant.settings as Record<string, unknown>) ?? {};
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          scimTokenHash: hashedToken,
          scimTokenCreatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`SCIM: generated new token for tenant ${tenantId}`);
    return plainToken;
  }

  async validateScimToken(tenantId: string, token: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    if (!tenant) return false;

    const settings = (tenant.settings as Record<string, unknown>) ?? {};
    const storedHash = settings['scimTokenHash'] as string | undefined;
    if (!storedHash) return false;

    return bcrypt.compare(token, storedHash);
  }

  async validateScimTokenByRequest(
    tenantId: string,
    authorizationHeader: string | undefined,
  ): Promise<boolean> {
    if (!authorizationHeader?.startsWith('Bearer ')) return false;
    const token = authorizationHeader.slice(7);
    return this.validateScimToken(tenantId, token);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private toScimUser(user: Record<string, unknown>, tenantId: string): ScimUser {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user['id'] as string,
      externalId: (user['scimExternalId'] as string | null) ?? undefined,
      userName: user['email'] as string,
      name: {
        givenName: user['firstName'] as string,
        familyName: user['lastName'] as string,
        formatted: `${user['firstName']} ${user['lastName']}`,
      },
      emails: [{ value: user['email'] as string, primary: true }],
      active: user['isActive'] as boolean,
      meta: {
        resourceType: 'User',
        created: (user['createdAt'] as Date).toISOString(),
        lastModified: (user['updatedAt'] as Date).toISOString(),
        location: `/scim/v2/Users/${user['id']}`,
      },
    };
  }

  private toScimGroup(
    groupId: string,
    displayName: string,
    members: Array<{ id: string; firstName: string; lastName: string }>,
    tenantId: string,
  ): ScimGroup {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: groupId,
      displayName,
      members: members.map((u) => ({
        value: u.id,
        display: `${u.firstName} ${u.lastName}`,
        $ref: `/scim/v2/Users/${u.id}`,
      })),
      meta: {
        resourceType: 'Group',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        location: `/scim/v2/Groups/${groupId}`,
      },
    };
  }

  private async buildVirtualGroups(tenantId: string): Promise<ScimGroup[]> {
    const roleGroupMap: Record<string, UserRole> = {
      teachers: UserRole.TEACHER,
      students: UserRole.STUDENT,
      admins: UserRole.ADMIN,
    };

    const groups = await Promise.all(
      Object.entries(roleGroupMap).map(async ([name, role]) => {
        const members = await this.prisma.user.findMany({
          where: { tenantId, role },
          select: { id: true, firstName: true, lastName: true },
        });
        const groupId = this.roleToGroupId(tenantId, role);
        return this.toScimGroup(groupId, name, members, tenantId);
      }),
    );

    return groups;
  }

  private async buildGroupResponse(
    tenantId: string,
    groupId: string,
    displayName: string,
    role: UserRole,
  ): Promise<ScimGroup> {
    const members = await this.prisma.user.findMany({
      where: { tenantId, role },
      select: { id: true, firstName: true, lastName: true },
    });
    return this.toScimGroup(groupId, displayName, members, tenantId);
  }

  private groupNameToRole(displayName: string): UserRole {
    const name = displayName.toLowerCase().trim();
    const mapping: Record<string, UserRole> = {
      teachers: UserRole.TEACHER,
      teacher: UserRole.TEACHER,
      students: UserRole.STUDENT,
      student: UserRole.STUDENT,
      admins: UserRole.ADMIN,
      admin: UserRole.ADMIN,
      administrators: UserRole.ADMIN,
    };
    return mapping[name] ?? UserRole.STUDENT;
  }

  private roleToGroupId(tenantId: string, role: UserRole): string {
    // Deterministic ID derived from tenantId + role
    return crypto
      .createHash('sha256')
      .update(`${tenantId}:${role}`)
      .digest('hex')
      .slice(0, 24);
  }

  private extractEmail(dto: ScimUserDto): string {
    if (dto.emails && dto.emails.length > 0) {
      const primary = dto.emails.find((e) => e.primary) ?? dto.emails[0];
      if (primary?.value) return primary.value;
    }
    // Fallback: userName is often the email
    return dto.userName;
  }

  private extractName(dto: ScimUserDto): { firstName: string; lastName: string } {
    if (dto.name) {
      return {
        firstName: dto.name.givenName ?? '',
        lastName: dto.name.familyName ?? '',
      };
    }
    // Try displayName split
    if (dto.displayName) {
      const parts = (dto.displayName as string).split(' ');
      return {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
      };
    }
    return { firstName: '', lastName: '' };
  }

  private extractValueKey(value: unknown, key: string): unknown {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }
}
