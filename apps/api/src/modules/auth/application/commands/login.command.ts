export class LoginCommand {
  email: string;
  password: string;
  tenantId: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}
