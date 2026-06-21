"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MfaSetupResult = exports.JwtPayload = exports.AuthUser = exports.AuthTokens = void 0;
class AuthTokens {
  accessToken;
  refreshToken;
  expiresIn;
  tokenType = 'Bearer';
  constructor(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}
exports.AuthTokens = AuthTokens;
class AuthUser {
  id;
  email;
  firstName;
  lastName;
  role;
  tenantId;
  tenantName;
  tenantSlug;
  mfaEnabled;
  avatarUrl;
  constructor(partial) {
    Object.assign(this, partial);
  }
}
exports.AuthUser = AuthUser;
class JwtPayload {
  sub;
  id;
  email;
  tenantId;
  role;
  firstName;
  lastName;
  mfaEnabled;
  iat;
  exp;
}
exports.JwtPayload = JwtPayload;
class MfaSetupResult {
  secret;
  qrCodeUrl;
  backupCodes;
}
exports.MfaSetupResult = MfaSetupResult;