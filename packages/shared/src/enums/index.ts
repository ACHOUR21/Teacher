/**
 * @eduai/shared — Platform Enumerations
 * Centralized enums used across all EduAI Ultimate services.
 */

// ─── User & Access Control ────────────────────────────────────────────────────

/** All roles a user can hold within the platform. */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  UNIVERSITY_ADMIN = 'UNIVERSITY_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  GUEST = 'GUEST',
}

/** Hierarchy weight for each role (higher = more permissions). */
export const USER_ROLE_WEIGHT: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 90,
  [UserRole.SCHOOL_ADMIN]: 70,
  [UserRole.UNIVERSITY_ADMIN]: 70,
  [UserRole.TEACHER]: 50,
  [UserRole.PARENT]: 30,
  [UserRole.STUDENT]: 20,
  [UserRole.GUEST]: 0,
};

// ─── Tenancy ──────────────────────────────────────────────────────────────────

/** Organisation type that provisions a tenant in the platform. */
export enum TenantType {
  SCHOOL = 'SCHOOL',
  UNIVERSITY = 'UNIVERSITY',
  CORPORATE = 'CORPORATE',
  INDIVIDUAL = 'INDIVIDUAL',
}

// ─── Subscription & Billing ───────────────────────────────────────────────────

/** Subscription tiers available to tenants. */
export enum SubscriptionPlan {
  FREE_TRIAL = 'FREE_TRIAL',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
  LIFETIME = 'LIFETIME',
}

/** Lifecycle state of a subscription. */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  TRIALING = 'TRIALING',
}

// ─── Content & Learning ───────────────────────────────────────────────────────

/** Distinct types of educational content in the platform. */
export enum ContentType {
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  LIVE_SESSION = 'LIVE_SESSION',
  AUDIO = 'AUDIO',
  SCORM = 'SCORM',
}

/** Lifecycle of a student assignment submission. */
export enum AssignmentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
}

/** Status of a live classroom / webinar session. */
export enum LiveSessionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** Delivery channel for a notification. */
export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

/** Read / delivery state of a single notification record. */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  FAILED = 'FAILED',
}

// ─── Payments ─────────────────────────────────────────────────────────────────

/** State of a payment transaction. */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/** Supported payment gateway providers. */
export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL',
}

// ─── Audit & Compliance ───────────────────────────────────────────────────────

/** Actions recorded in the immutable audit log. */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  ENROLL = 'ENROLL',
  UNENROLL = 'UNENROLL',
  SUBMIT = 'SUBMIT',
  GRADE = 'GRADE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  PUBLISH = 'PUBLISH',
  UNPUBLISH = 'UNPUBLISH',
}

// ─── AI Module Types ──────────────────────────────────────────────────────────

/**
 * All 17 AI-powered modules available in the EduAI Ultimate platform.
 * Each value maps to a dedicated system prompt and service implementation.
 */
export enum AIModuleType {
  /** Adaptive 1-on-1 tutoring agent that explains concepts and answers questions. */
  TUTOR = 'TUTOR',
  /** Guides students step-by-step through homework without giving direct answers. */
  HOMEWORK_ASSISTANT = 'HOMEWORK_ASSISTANT',
  /** Generates quizzes and exams from course material with configurable difficulty. */
  EXAM_GENERATOR = 'EXAM_GENERATOR',
  /** Creates structured lesson plans from topic keywords and learning objectives. */
  LESSON_GENERATOR = 'LESSON_GENERATOR',
  /** Builds full course curricula including learning paths and milestones. */
  CURRICULUM_GENERATOR = 'CURRICULUM_GENERATOR',
  /** Converts notes or text into spaced-repetition flashcard decks. */
  FLASHCARDS = 'FLASHCARDS',
  /** Generates interactive visual mind maps from topics or documents. */
  MIND_MAP = 'MIND_MAP',
  /** Research helper that summarises sources, cites references, and avoids hallucinations. */
  RESEARCH_ASSISTANT = 'RESEARCH_ASSISTANT',
  /** Translates educational content into 50+ languages with pedagogical accuracy. */
  TRANSLATOR = 'TRANSLATOR',
  /** Converts recorded or live speech to accurate, punctuated transcripts. */
  SPEECH_TO_TEXT = 'SPEECH_TO_TEXT',
  /** Synthesises natural-sounding audio from lesson text with voice options. */
  TEXT_TO_SPEECH = 'TEXT_TO_SPEECH',
  /** Personalised content and course recommendations based on learner history. */
  RECOMMENDATION = 'RECOMMENDATION',
  /** Maps student skills to career pathways and recommends upskilling courses. */
  CAREER_ADVISOR = 'CAREER_ADVISOR',
  /** Predicts student academic performance from engagement and assessment data. */
  PERFORMANCE_PREDICTION = 'PERFORMANCE_PREDICTION',
  /** Identifies students at risk of dropping out using behavioural signals. */
  DROPOUT_PREDICTION = 'DROPOUT_PREDICTION',
  /** Flags inappropriate or policy-violating content in submissions and messages. */
  CONTENT_MODERATION = 'CONTENT_MODERATION',
  /** Detects AI-generated or plagiarised content in student submissions. */
  PLAGIARISM_DETECTION = 'PLAGIARISM_DETECTION',
}

// ─── File & Media ─────────────────────────────────────────────────────────────

/** Storage provider used for a given file upload. */
export enum StorageProvider {
  S3 = 'S3',
  MINIO = 'MINIO',
  CLOUDFLARE_R2 = 'CLOUDFLARE_R2',
  LOCAL = 'LOCAL',
}

/** Processing state of an uploaded file (e.g. video transcoding). */
export enum FileStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

// ─── Course & Enrollment ──────────────────────────────────────────────────────

/** Publication state of a course. */
export enum CourseStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/** Student's progress state in an enrolled course. */
export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  WITHDRAWN = 'WITHDRAWN',
  SUSPENDED = 'SUSPENDED',
}

// ─── Language & Localisation ──────────────────────────────────────────────────

/** ISO 639-1 language codes supported on the platform. */
export enum SupportedLanguage {
  EN = 'en',
  AR = 'ar',
  ZH = 'zh',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  HI = 'hi',
  ID = 'id',
  IT = 'it',
  JA = 'ja',
  KO = 'ko',
  MS = 'ms',
  NL = 'nl',
  PL = 'pl',
  PT = 'pt',
  RU = 'ru',
  SV = 'sv',
  TR = 'tr',
  UK = 'uk',
  UR = 'ur',
  VI = 'vi',
}
