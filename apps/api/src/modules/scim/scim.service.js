"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScimService = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var crypto = _interopRequireWildcard(require("crypto"));
var bcrypt = _interopRequireWildcard(require("bcrypt"));
var _prisma = require("../database/prisma.service");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var ScimService_1;
let ScimService = exports.ScimService = ScimService_1 = class ScimService {
  logger = new _common.Logger(ScimService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  // ─── User Operations ──────────────────────────────────────────────────────
  async listUsers(tenantId, filter, startIndex = 1, count = 100) {
    const skip = Math.max(0, startIndex - 1);
    const take = Math.min(count, 200);
    const where = {
      tenantId
    };
    // Parse simple SCIM filters: userName eq "value" or email eq "value"
    if (filter) {
      const userNameMatch = filter.match(/userName\s+eq\s+"([^"]+)"/i);
      const emailMatch = filter.match(/emails?\s+eq\s+"([^"]+)"/i);
      if (userNameMatch?.[1]) {
        where.email = {
          equals: userNameMatch[1],
          mode: 'insensitive'
        };
      } else if (emailMatch?.[1]) {
        where.email = {
          equals: emailMatch[1],
          mode: 'insensitive'
        };
      }
    }
    const [users, totalResults] = await Promise.all([this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'asc'
      }
    }), this.prisma.user.count({
      where
    })]);
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: users.length,
      Resources: users.map(u => this.toScimUser(u, tenantId))
    };
  }
  async getUser(tenantId, scimId) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: scimId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException(`User ${scimId} not found`);
    }
    return this.toScimUser(user, tenantId);
  }
  async createUser(tenantId, dto) {
    const email = this.extractEmail(dto);
    const {
      firstName,
      lastName
    } = this.extractName(dto);
    // Check if user already exists in this tenant
    const existing = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });
    if (existing) {
      // Link: update with externalId and mark SCIM-managed
      const linked = await this.prisma.user.update({
        where: {
          id: existing.id
        },
        data: {
          scimExternalId: dto.externalId ?? null,
          scimManaged: true,
          emailVerified: true,
          isActive: dto.active !== false,
          ...(firstName && {
            firstName
          }),
          ...(lastName && {
            lastName
          })
        }
      });
      this.logger.log(`SCIM: linked existing user ${linked.id} in tenant ${tenantId}`);
      return this.toScimUser(linked, tenantId);
    }
    // Create new user — IdP is authoritative, so emailVerified = true
    const tempPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const created = await this.prisma.user.create({
      data: {
        tenantId,
        email: email.toLowerCase(),
        passwordHash: tempPasswordHash,
        firstName: firstName || 'Unknown',
        lastName: lastName || 'User',
        emailVerified: true,
        isActive: dto.active !== false,
        role: _client.UserRole.STUDENT,
        scimExternalId: dto.externalId ?? null,
        scimManaged: true
      }
    });
    this.logger.log(`SCIM: provisioned new user ${created.id} in tenant ${tenantId}`);
    return this.toScimUser(created, tenantId);
  }
  async replaceUser(tenantId, scimId, dto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: scimId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException(`User ${scimId} not found`);
    }
    const email = this.extractEmail(dto);
    const {
      firstName,
      lastName
    } = this.extractName(dto);
    // Check email uniqueness when changing email
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          tenantId,
          email: {
            equals: email,
            mode: 'insensitive'
          },
          id: {
            not: scimId
          }
        }
      });
      if (conflict) {
        throw new _common.ConflictException(`Email ${email} already in use`);
      }
    }
    const updated = await this.prisma.user.update({
      where: {
        id: scimId
      },
      data: {
        email: email.toLowerCase(),
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        isActive: dto.active !== false,
        scimExternalId: dto.externalId ?? user.scimExternalId,
        scimManaged: true,
        emailVerified: true
      }
    });
    return this.toScimUser(updated, tenantId);
  }
  async patchUser(tenantId, scimId, operations) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: scimId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException(`User ${scimId} not found`);
    }
    const updateData = {};
    for (const op of operations) {
      const opLower = op.op.toLowerCase();
      const path = op.path?.toLowerCase();
      if (path === 'active' || !path && this.extractValueKey(op.value, 'active') !== undefined) {
        const activeVal = path === 'active' ? op.value : this.extractValueKey(op.value, 'active');
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
        const val = op.value;
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
      where: {
        id: scimId
      },
      data: updateData
    });
    return this.toScimUser(updated, tenantId);
  }
  async deleteUser(tenantId, scimId) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: scimId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException(`User ${scimId} not found`);
    }
    // Soft-delete: preserve audit trail
    await this.prisma.user.update({
      where: {
        id: scimId
      },
      data: {
        isActive: false
      }
    });
    this.logger.log(`SCIM: deprovisioned user ${scimId} in tenant ${tenantId}`);
  }
  // ─── Group Operations ─────────────────────────────────────────────────────
  async listGroups(tenantId, filter, startIndex = 1, count = 100) {
    const skip = Math.max(0, startIndex - 1);
    const take = Math.min(count, 200);
    // Groups are virtual — derived from distinct roles in this tenant
    const roleGroups = await this.buildVirtualGroups(tenantId);
    // Simple filter support: displayName eq "teachers"
    let filtered = roleGroups;
    if (filter) {
      const nameMatch = filter.match(/displayName\s+eq\s+"([^"]+)"/i);
      if (nameMatch?.[1]) {
        filtered = roleGroups.filter(g => g.displayName.toLowerCase() === nameMatch[1].toLowerCase());
      }
    }
    const totalResults = filtered.length;
    const page = filtered.slice(skip, skip + take);
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: page.length,
      Resources: page
    };
  }
  async getGroup(tenantId, scimId) {
    const groups = await this.buildVirtualGroups(tenantId);
    const group = groups.find(g => g.id === scimId);
    if (!group) {
      throw new _common.NotFoundException(`Group ${scimId} not found`);
    }
    return group;
  }
  async createGroup(tenantId, dto) {
    const role = this.groupNameToRole(dto.displayName);
    // Add members to the role group
    if (dto.members && dto.members.length > 0) {
      await Promise.all(dto.members.map(async member => {
        const user = await this.prisma.user.findFirst({
          where: {
            id: member.value,
            tenantId
          }
        });
        if (user) {
          await this.prisma.user.update({
            where: {
              id: user.id
            },
            data: {
              role
            }
          });
        }
      }));
    }
    const groupId = this.roleToGroupId(tenantId, role);
    return this.buildGroupResponse(tenantId, groupId, dto.displayName, role);
  }
  async replaceGroup(tenantId, scimId, dto) {
    const role = this.groupNameToRole(dto.displayName);
    // Determine which users should be in this group
    const newMemberIds = (dto.members ?? []).map(m => m.value);
    // Get current members of this role group
    const currentMembers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role
      },
      select: {
        id: true
      }
    });
    const currentMemberIds = currentMembers.map(u => u.id);
    // Add new members
    const toAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
    // Remove members no longer in group (demote to STUDENT)
    const toRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));
    await Promise.all([...toAdd.map(userId => this.prisma.user.updateMany({
      where: {
        id: userId,
        tenantId
      },
      data: {
        role
      }
    })), ...toRemove.map(userId => this.prisma.user.updateMany({
      where: {
        id: userId,
        tenantId,
        role
      },
      data: {
        role: _client.UserRole.STUDENT
      }
    }))]);
    return this.buildGroupResponse(tenantId, scimId, dto.displayName, role);
  }
  async deleteGroup(tenantId, scimId) {
    // Virtual groups cannot be truly deleted — demote all members to STUDENT
    const groups = await this.buildVirtualGroups(tenantId);
    const group = groups.find(g => g.id === scimId);
    if (!group) {
      throw new _common.NotFoundException(`Group ${scimId} not found`);
    }
    const role = this.groupNameToRole(group.displayName);
    if (role !== _client.UserRole.STUDENT) {
      await this.prisma.user.updateMany({
        where: {
          tenantId,
          role
        },
        data: {
          role: _client.UserRole.STUDENT
        }
      });
    }
    this.logger.log(`SCIM: deleted group ${scimId} (role ${role}) in tenant ${tenantId}`);
  }
  // ─── SCIM Token Management ────────────────────────────────────────────────
  async generateScimToken(tenantId) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const settings = tenant.settings ?? {};
    await this.prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        settings: {
          ...settings,
          scimTokenHash: hashedToken,
          scimTokenCreatedAt: new Date().toISOString()
        }
      }
    });
    this.logger.log(`SCIM: generated new token for tenant ${tenantId}`);
    return plainToken;
  }
  async validateScimToken(tenantId, token) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        settings: true
      }
    });
    if (!tenant) return false;
    const settings = tenant.settings ?? {};
    const storedHash = settings['scimTokenHash'];
    if (!storedHash) return false;
    return bcrypt.compare(token, storedHash);
  }
  async validateScimTokenByRequest(tenantId, authorizationHeader) {
    if (!authorizationHeader?.startsWith('Bearer ')) return false;
    const token = authorizationHeader.slice(7);
    return this.validateScimToken(tenantId, token);
  }
  // ─── Private Helpers ──────────────────────────────────────────────────────
  toScimUser(user, tenantId) {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user['id'],
      externalId: user['scimExternalId'] ?? undefined,
      userName: user['email'],
      name: {
        givenName: user['firstName'],
        familyName: user['lastName'],
        formatted: `${user['firstName']} ${user['lastName']}`
      },
      emails: [{
        value: user['email'],
        primary: true
      }],
      active: user['isActive'],
      meta: {
        resourceType: 'User',
        created: user['createdAt'].toISOString(),
        lastModified: user['updatedAt'].toISOString(),
        location: `/scim/v2/Users/${user['id']}`
      }
    };
  }
  toScimGroup(groupId, displayName, members, tenantId) {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: groupId,
      displayName,
      members: members.map(u => ({
        value: u.id,
        display: `${u.firstName} ${u.lastName}`,
        $ref: `/scim/v2/Users/${u.id}`
      })),
      meta: {
        resourceType: 'Group',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        location: `/scim/v2/Groups/${groupId}`
      }
    };
  }
  async buildVirtualGroups(tenantId) {
    const roleGroupMap = {
      teachers: _client.UserRole.TEACHER,
      students: _client.UserRole.STUDENT,
      admins: _client.UserRole.ADMIN
    };
    const groups = await Promise.all(Object.entries(roleGroupMap).map(async ([name, role]) => {
      const members = await this.prisma.user.findMany({
        where: {
          tenantId,
          role
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });
      const groupId = this.roleToGroupId(tenantId, role);
      return this.toScimGroup(groupId, name, members, tenantId);
    }));
    return groups;
  }
  async buildGroupResponse(tenantId, groupId, displayName, role) {
    const members = await this.prisma.user.findMany({
      where: {
        tenantId,
        role
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });
    return this.toScimGroup(groupId, displayName, members, tenantId);
  }
  groupNameToRole(displayName) {
    const name = displayName.toLowerCase().trim();
    const mapping = {
      teachers: _client.UserRole.TEACHER,
      teacher: _client.UserRole.TEACHER,
      students: _client.UserRole.STUDENT,
      student: _client.UserRole.STUDENT,
      admins: _client.UserRole.ADMIN,
      admin: _client.UserRole.ADMIN,
      administrators: _client.UserRole.ADMIN
    };
    return mapping[name] ?? _client.UserRole.STUDENT;
  }
  roleToGroupId(tenantId, role) {
    // Deterministic ID derived from tenantId + role
    return crypto.createHash('sha256').update(`${tenantId}:${role}`).digest('hex').slice(0, 24);
  }
  extractEmail(dto) {
    if (dto.emails && dto.emails.length > 0) {
      const primary = dto.emails.find(e => e.primary) ?? dto.emails[0];
      if (primary?.value) return primary.value;
    }
    // Fallback: userName is often the email
    return dto.userName;
  }
  extractName(dto) {
    if (dto.name) {
      return {
        firstName: dto.name.givenName ?? '',
        lastName: dto.name.familyName ?? ''
      };
    }
    // Try displayName split
    if (dto.displayName) {
      const parts = dto.displayName.split(' ');
      return {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? ''
      };
    }
    return {
      firstName: '',
      lastName: ''
    };
  }
  extractValueKey(value, key) {
    if (value && typeof value === 'object') {
      return value[key];
    }
    return undefined;
  }
};
exports.ScimService = ScimService = ScimService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], ScimService);