/**
 * @eduai/shared — Platform Constants
 * Single source of truth for limits, permissions, and configuration values.
 */
import { SubscriptionPlan, UserRole } from '../enums/index.js';
// ─── File Upload Limits ───────────────────────────────────────────────────────
/** Maximum file size per upload in bytes. */
export const MAX_FILE_SIZE = {
    /** 500 MB — for lecture video uploads. */
    VIDEO: 500 * 1024 * 1024,
    /** 50 MB — for PDFs, presentations, spreadsheets. */
    DOCUMENT: 50 * 1024 * 1024,
    /** 20 MB — for profile pictures, banners, thumbnails. */
    IMAGE: 20 * 1024 * 1024,
    /** 100 MB — for podcast episodes and recorded audio. */
    AUDIO: 100 * 1024 * 1024,
    /** 200 MB — for SCORM packages. */
    SCORM: 200 * 1024 * 1024,
    /** 10 MB — for assignment file submissions. */
    ASSIGNMENT: 10 * 1024 * 1024,
};
/** Allowed MIME types for each upload category. */
export const ALLOWED_MIME_TYPES = {
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    DOCUMENT: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac'],
    SCORM: ['application/zip', 'application/x-zip-compressed'],
};
/** Per-plan resource and feature limits. */
export const SUBSCRIPTION_LIMITS = {
    [SubscriptionPlan.FREE_TRIAL]: {
        maxStudents: 30,
        maxTeachers: 2,
        maxCourses: 3,
        storageBytes: 1 * 1024 * 1024 * 1024, // 1 GB
        aiTokensPerDay: 10_000,
        aiCreditsPerMonth: 100,
        maxConcurrentLiveSessions: 1,
        maxSubTenants: 0,
        apiRateLimit: 60,
        customDomain: false,
        analyticsEnabled: false,
        ssoEnabled: false,
        dedicatedSupport: false,
    },
    [SubscriptionPlan.STARTER]: {
        maxStudents: 250,
        maxTeachers: 10,
        maxCourses: 25,
        storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
        aiTokensPerDay: 100_000,
        aiCreditsPerMonth: 1_000,
        maxConcurrentLiveSessions: 5,
        maxSubTenants: 0,
        apiRateLimit: 120,
        customDomain: false,
        analyticsEnabled: true,
        ssoEnabled: false,
        dedicatedSupport: false,
    },
    [SubscriptionPlan.PROFESSIONAL]: {
        maxStudents: 1_000,
        maxTeachers: 50,
        maxCourses: 100,
        storageBytes: 200 * 1024 * 1024 * 1024, // 200 GB
        aiTokensPerDay: 500_000,
        aiCreditsPerMonth: 10_000,
        maxConcurrentLiveSessions: 20,
        maxSubTenants: 5,
        apiRateLimit: 300,
        customDomain: true,
        analyticsEnabled: true,
        ssoEnabled: true,
        dedicatedSupport: false,
    },
    [SubscriptionPlan.BUSINESS]: {
        maxStudents: 10_000,
        maxTeachers: 250,
        maxCourses: 500,
        storageBytes: 1024 * 1024 * 1024 * 1024, // 1 TB
        aiTokensPerDay: 2_000_000,
        aiCreditsPerMonth: 50_000,
        maxConcurrentLiveSessions: 100,
        maxSubTenants: 20,
        apiRateLimit: 1_000,
        customDomain: true,
        analyticsEnabled: true,
        ssoEnabled: true,
        dedicatedSupport: false,
    },
    [SubscriptionPlan.ENTERPRISE]: {
        maxStudents: -1,
        maxTeachers: -1,
        maxCourses: -1,
        storageBytes: -1,
        aiTokensPerDay: -1,
        aiCreditsPerMonth: -1,
        maxConcurrentLiveSessions: -1,
        maxSubTenants: -1,
        apiRateLimit: -1,
        customDomain: true,
        analyticsEnabled: true,
        ssoEnabled: true,
        dedicatedSupport: true,
    },
    [SubscriptionPlan.LIFETIME]: {
        maxStudents: -1,
        maxTeachers: -1,
        maxCourses: -1,
        storageBytes: -1,
        aiTokensPerDay: -1,
        aiCreditsPerMonth: -1,
        maxConcurrentLiveSessions: -1,
        maxSubTenants: -1,
        apiRateLimit: -1,
        customDomain: true,
        analyticsEnabled: true,
        ssoEnabled: true,
        dedicatedSupport: true,
    },
};
// ─── RBAC Permission Matrix ───────────────────────────────────────────────────
/**
 * Resource:action permission strings.
 * Follows the pattern "<resource>:<action>".
 */
export const PERMISSIONS = {
    // Users
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_IMPERSONATE: 'user:impersonate',
    // Tenants
    TENANT_CREATE: 'tenant:create',
    TENANT_READ: 'tenant:read',
    TENANT_UPDATE: 'tenant:update',
    TENANT_DELETE: 'tenant:delete',
    TENANT_BILLING: 'tenant:billing',
    // Courses
    COURSE_CREATE: 'course:create',
    COURSE_READ: 'course:read',
    COURSE_UPDATE: 'course:update',
    COURSE_DELETE: 'course:delete',
    COURSE_PUBLISH: 'course:publish',
    COURSE_ENROLL: 'course:enroll',
    // Assignments
    ASSIGNMENT_CREATE: 'assignment:create',
    ASSIGNMENT_READ: 'assignment:read',
    ASSIGNMENT_SUBMIT: 'assignment:submit',
    ASSIGNMENT_GRADE: 'assignment:grade',
    // AI Modules
    AI_USE: 'ai:use',
    AI_CONFIGURE: 'ai:configure',
    AI_USAGE_READ: 'ai:usage:read',
    // Analytics
    ANALYTICS_READ: 'analytics:read',
    ANALYTICS_EXPORT: 'analytics:export',
    // Live Sessions
    LIVE_SESSION_CREATE: 'live_session:create',
    LIVE_SESSION_JOIN: 'live_session:join',
    LIVE_SESSION_MANAGE: 'live_session:manage',
    // Content Moderation
    CONTENT_MODERATE: 'content:moderate',
    // Audit Log
    AUDIT_LOG_READ: 'audit_log:read',
    // Billing / Payments
    BILLING_READ: 'billing:read',
    BILLING_MANAGE: 'billing:manage',
    // Reports
    REPORT_READ: 'report:read',
    REPORT_EXPORT: 'report:export',
};
/**
 * Permissions granted to each role.
 * Lower roles inherit nothing automatically — use this map in your guard.
 */
export const RBAC_PERMISSIONS = {
    [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),
    [UserRole.ADMIN]: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_DELETE,
        PERMISSIONS.TENANT_READ,
        PERMISSIONS.TENANT_UPDATE,
        PERMISSIONS.TENANT_BILLING,
        PERMISSIONS.COURSE_CREATE,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.COURSE_UPDATE,
        PERMISSIONS.COURSE_DELETE,
        PERMISSIONS.COURSE_PUBLISH,
        PERMISSIONS.COURSE_ENROLL,
        PERMISSIONS.ASSIGNMENT_CREATE,
        PERMISSIONS.ASSIGNMENT_READ,
        PERMISSIONS.ASSIGNMENT_GRADE,
        PERMISSIONS.AI_USE,
        PERMISSIONS.AI_CONFIGURE,
        PERMISSIONS.AI_USAGE_READ,
        PERMISSIONS.ANALYTICS_READ,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.LIVE_SESSION_CREATE,
        PERMISSIONS.LIVE_SESSION_JOIN,
        PERMISSIONS.LIVE_SESSION_MANAGE,
        PERMISSIONS.CONTENT_MODERATE,
        PERMISSIONS.AUDIT_LOG_READ,
        PERMISSIONS.BILLING_READ,
        PERMISSIONS.BILLING_MANAGE,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.REPORT_EXPORT,
    ],
    [UserRole.SCHOOL_ADMIN]: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.COURSE_CREATE,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.COURSE_UPDATE,
        PERMISSIONS.COURSE_DELETE,
        PERMISSIONS.COURSE_PUBLISH,
        PERMISSIONS.COURSE_ENROLL,
        PERMISSIONS.ASSIGNMENT_CREATE,
        PERMISSIONS.ASSIGNMENT_READ,
        PERMISSIONS.ASSIGNMENT_GRADE,
        PERMISSIONS.AI_USE,
        PERMISSIONS.AI_CONFIGURE,
        PERMISSIONS.AI_USAGE_READ,
        PERMISSIONS.ANALYTICS_READ,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.LIVE_SESSION_CREATE,
        PERMISSIONS.LIVE_SESSION_JOIN,
        PERMISSIONS.LIVE_SESSION_MANAGE,
        PERMISSIONS.CONTENT_MODERATE,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.BILLING_READ,
    ],
    [UserRole.UNIVERSITY_ADMIN]: [
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.COURSE_CREATE,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.COURSE_UPDATE,
        PERMISSIONS.COURSE_DELETE,
        PERMISSIONS.COURSE_PUBLISH,
        PERMISSIONS.COURSE_ENROLL,
        PERMISSIONS.ASSIGNMENT_CREATE,
        PERMISSIONS.ASSIGNMENT_READ,
        PERMISSIONS.ASSIGNMENT_GRADE,
        PERMISSIONS.AI_USE,
        PERMISSIONS.AI_CONFIGURE,
        PERMISSIONS.AI_USAGE_READ,
        PERMISSIONS.ANALYTICS_READ,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.LIVE_SESSION_CREATE,
        PERMISSIONS.LIVE_SESSION_JOIN,
        PERMISSIONS.LIVE_SESSION_MANAGE,
        PERMISSIONS.CONTENT_MODERATE,
        PERMISSIONS.REPORT_READ,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.BILLING_READ,
    ],
    [UserRole.TEACHER]: [
        PERMISSIONS.USER_READ,
        PERMISSIONS.COURSE_CREATE,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.COURSE_UPDATE,
        PERMISSIONS.COURSE_PUBLISH,
        PERMISSIONS.ASSIGNMENT_CREATE,
        PERMISSIONS.ASSIGNMENT_READ,
        PERMISSIONS.ASSIGNMENT_GRADE,
        PERMISSIONS.AI_USE,
        PERMISSIONS.ANALYTICS_READ,
        PERMISSIONS.LIVE_SESSION_CREATE,
        PERMISSIONS.LIVE_SESSION_JOIN,
        PERMISSIONS.LIVE_SESSION_MANAGE,
    ],
    [UserRole.STUDENT]: [
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.COURSE_ENROLL,
        PERMISSIONS.ASSIGNMENT_READ,
        PERMISSIONS.ASSIGNMENT_SUBMIT,
        PERMISSIONS.AI_USE,
        PERMISSIONS.LIVE_SESSION_JOIN,
    ],
    [UserRole.PARENT]: [
        PERMISSIONS.USER_READ,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.ASSIGNMENT_READ,
        PERMISSIONS.ANALYTICS_READ,
    ],
    [UserRole.GUEST]: [PERMISSIONS.COURSE_READ],
};
/** All languages supported by the EduAI platform UI and AI translation module. */
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
];
// ─── Cache TTLs (seconds) ─────────────────────────────────────────────────────
export const CACHE_TTL = {
    USER_PROFILE: 300, // 5 min
    COURSE_LIST: 60, // 1 min
    COURSE_DETAIL: 120, // 2 min
    TENANT_CONFIG: 600, // 10 min
    SUBSCRIPTION: 300, // 5 min
    AI_SYSTEM_PROMPT: 3600, // 1 hr — prompts rarely change
    ANALYTICS_DASHBOARD: 300, // 5 min
    LEADERBOARD: 60, // 1 min
};
// ─── Pagination Defaults ──────────────────────────────────────────────────────
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
// ─── Rate Limiting ────────────────────────────────────────────────────────────
export const RATE_LIMIT = {
    /** General API — requests per minute per user. */
    API_GENERAL: 120,
    /** Auth endpoints — requests per minute per IP. */
    AUTH: 10,
    /** AI endpoints — requests per minute per user. */
    AI: 30,
    /** File uploads — requests per minute per user. */
    UPLOAD: 20,
};
// ─── Regex Patterns ───────────────────────────────────────────────────────────
export const REGEX = {
    /** Standard email validation. */
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    /** Strong password: min 8 chars, upper, lower, digit, special char. */
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=<>{}[\]])[A-Za-z\d@$!%*?&#^()_\-+=<>{}[\]]{8,}$/,
    /** UUID v4. */
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    /** Subdomain slug: lowercase letters, digits, hyphens. */
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    /** Phone number in E.164 format. */
    E164_PHONE: /^\+[1-9]\d{1,14}$/,
};
// ─── Default Values ───────────────────────────────────────────────────────────
export const DEFAULTS = {
    LANGUAGE: 'en',
    TIMEZONE: 'UTC',
    CURRENCY: 'USD',
    AVATAR_URL: 'https://app.eduai.io/assets/default-avatar.png',
    TENANT_LOGO_URL: 'https://app.eduai.io/assets/default-logo.png',
    PASSING_GRADE_PERCENT: 60,
    MAX_QUIZ_ATTEMPTS: 3,
    SESSION_DURATION_MINUTES: 60,
};
// ─── AI Token Costs ───────────────────────────────────────────────────────────
/**
 * Approximate token costs per 1 000 tokens for billing purposes.
 * Actual costs depend on the provider's pricing.
 */
export const AI_TOKEN_COST_PER_1K = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
    'claude-haiku-4-5': { input: 0.00025, output: 0.00125 },
};
