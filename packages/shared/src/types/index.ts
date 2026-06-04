/**
 * @eduai/shared — Common TypeScript Interfaces
 * Platform-wide contracts used by API, frontend, and mobile layers.
 */

import type { AIModuleType, AuditAction, NotificationType, UserRole } from '../enums/index.js';

// ─── Generic API Primitives ───────────────────────────────────────────────────

/**
 * Standard envelope returned by every REST API endpoint.
 * success=true  → data is populated, error is undefined
 * success=false → error is populated, data is undefined
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  /** RFC 7807 — Problem Details */
  type?: string;
  traceId?: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  processingTimeMs?: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Query parameters accepted by any paginated list endpoint. */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  /** ISO 8601 date string — filter records created on or after this date. */
  fromDate?: string;
  /** ISO 8601 date string — filter records created on or before this date. */
  toDate?: string;
}

/** Paginated response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Multi-Tenancy ────────────────────────────────────────────────────────────

/**
 * Tenant context injected into every authenticated request.
 * Resolved from the JWT claims and/or the Host header.
 */
export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string;
  tenantName: string;
  /** ISO 639-1 code of the tenant's default language. */
  defaultLanguage: string;
  /** IANA timezone string e.g. "Europe/London". */
  timezone: string;
  /** Active subscription plan. Affects feature gating at the service layer. */
  plan: string;
  /** True when the tenant is in read-only maintenance mode. */
  isMaintenanceMode: boolean;
}

// ─── Authentication & Authorisation ──────────────────────────────────────────

/** Shape of the decoded JWT access-token payload. */
export interface JwtPayload {
  /** User UUID. */
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantSlug: string;
  /** Tenant-scoped permissions e.g. ["course:create", "user:read"]. */
  permissions: string[];
  /** Whether the user has completed MFA for this session. */
  mfaVerified: boolean;
  /** Issued-at (Unix seconds). */
  iat: number;
  /** Expiration (Unix seconds). */
  exp: number;
  /** Issuer claim. */
  iss: string;
  /** Audience claim. */
  aud: string | string[];
  /** JWT ID — unique token identifier used for revocation. */
  jti: string;
}

/** Shape of the decoded JWT refresh-token payload. */
export interface JwtRefreshPayload {
  sub: string;
  tenantId: string;
  jti: string;
  family: string;
  iat: number;
  exp: number;
}

/** Session data stored in Redis for each authenticated user. */
export interface UserSession {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  accessTokenJti: string;
  refreshTokenJti: string;
  refreshTokenFamily: string;
  mfaVerified: boolean;
  deviceInfo: DeviceInfo;
  createdAt: string;
  lastActivityAt: string;
}

// ─── Device & Client Info ─────────────────────────────────────────────────────

export interface DeviceInfo {
  /** 'web' | 'mobile' | 'desktop' */
  platform: string;
  userAgent?: string;
  ipAddress?: string;
  /** Unique device fingerprint (mobile) or browser fingerprint (web). */
  deviceId?: string;
  /** Push-notification token. */
  fcmToken?: string;
}

// ─── File Uploads ─────────────────────────────────────────────────────────────

/** Metadata for a file that has been uploaded to object storage. */
export interface FileUpload {
  /** Internal UUID of the file record. */
  id: string;
  /** Original filename provided by the client. */
  originalName: string;
  /** Sanitised filename stored in the bucket. */
  storedName: string;
  /** MIME type e.g. "video/mp4". */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Public or pre-signed URL for accessing the file. */
  url: string;
  /** Storage key / object path inside the bucket. */
  key: string;
  /** Name of the S3/MinIO bucket. */
  bucket: string;
  /** Uploader user ID. */
  uploadedBy: string;
  /** Tenant that owns the file. */
  tenantId: string;
  uploadedAt: string;
}

/** Pre-signed upload URL response for direct browser → storage uploads. */
export interface PresignedUploadUrl {
  uploadUrl: string;
  fileKey: string;
  /** Fields that must be included in the multipart upload form (S3). */
  fields?: Record<string, string>;
  /** Expiry time in seconds. */
  expiresIn: number;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface CreateNotificationDto {
  recipientId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Deep-link or web route. */
  actionUrl?: string;
  /** Any extra data to attach to the notification record. */
  metadata?: Record<string, unknown>;
  /** ISO 8601 — schedule delivery for a future time. */
  scheduledAt?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  /** JSON snapshot of the resource state before the change. */
  before?: Record<string, unknown>;
  /** JSON snapshot of the resource state after the change. */
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ─── AI Module Contracts ──────────────────────────────────────────────────────

export interface AIRequestContext {
  /** The AI module being invoked. */
  module: AIModuleType;
  userId: string;
  tenantId: string;
  /** ISO 639-1 language code. Responses should be in this language. */
  language?: string;
  /** Arbitrary key-value metadata forwarded to the AI layer. */
  metadata?: Record<string, unknown>;
}

export interface AIStreamChunk {
  /** Incremental text delta from the model. */
  delta: string;
  /** Whether this is the final chunk in the stream. */
  done: boolean;
  /** Cumulative token count (populated on the final chunk). */
  totalTokens?: number;
}

export interface AIUsageRecord {
  userId: string;
  tenantId: string;
  module: AIModuleType;
  provider: 'openai' | 'anthropic';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  timestamp: string;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: Record<string, ServiceHealthStatus>;
}

export interface ServiceHealthStatus {
  status: 'ok' | 'error';
  latencyMs?: number;
  message?: string;
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  tenantId: string;
  payload: T;
  createdAt: string;
  /** Retry count — 0 on first delivery. */
  retryCount: number;
}
