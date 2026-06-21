"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RegisterCommand = exports.CreateTenantAndAdminCommand = void 0;
class RegisterCommand {
  firstName;
  lastName;
  email;
  password;
  tenantId;
  role;
  phone;
  deviceId;
  ipAddress;
  userAgent;
}
exports.RegisterCommand = RegisterCommand;
class CreateTenantAndAdminCommand {
  tenantName;
  tenantSlug;
  tenantType;
  adminFirstName;
  adminLastName;
  adminEmail;
  adminPassword;
  adminPhone;
  ipAddress;
  userAgent;
}
exports.CreateTenantAndAdminCommand = CreateTenantAndAdminCommand;