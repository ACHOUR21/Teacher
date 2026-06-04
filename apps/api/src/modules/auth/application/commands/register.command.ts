import { TenantType, UserRole } from '@prisma/client';

export class RegisterCommand {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantId: string;
  role?: UserRole;
  phone?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class CreateTenantAndAdminCommand {
  tenantName: string;
  tenantSlug: string;
  tenantType: TenantType;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
  ipAddress?: string;
  userAgent?: string;
}
