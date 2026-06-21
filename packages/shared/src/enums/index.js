/**
 * @eduai/shared — Platform Enumerations
 * Centralized enums used across all EduAI Ultimate services.
 */
// ─── User & Access Control ────────────────────────────────────────────────────
/** All roles a user can hold within the platform. */
export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SCHOOL_ADMIN"] = "SCHOOL_ADMIN";
    UserRole["UNIVERSITY_ADMIN"] = "UNIVERSITY_ADMIN";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["PARENT"] = "PARENT";
    UserRole["GUEST"] = "GUEST";
})(UserRole || (UserRole = {}));
/** Hierarchy weight for each role (higher = more permissions). */
export const USER_ROLE_WEIGHT = {
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
export var TenantType;
(function (TenantType) {
    TenantType["SCHOOL"] = "SCHOOL";
    TenantType["UNIVERSITY"] = "UNIVERSITY";
    TenantType["CORPORATE"] = "CORPORATE";
    TenantType["INDIVIDUAL"] = "INDIVIDUAL";
})(TenantType || (TenantType = {}));
// ─── Subscription & Billing ───────────────────────────────────────────────────
/** Subscription tiers available to tenants. */
export var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE_TRIAL"] = "FREE_TRIAL";
    SubscriptionPlan["STARTER"] = "STARTER";
    SubscriptionPlan["PROFESSIONAL"] = "PROFESSIONAL";
    SubscriptionPlan["BUSINESS"] = "BUSINESS";
    SubscriptionPlan["ENTERPRISE"] = "ENTERPRISE";
    SubscriptionPlan["LIFETIME"] = "LIFETIME";
})(SubscriptionPlan || (SubscriptionPlan = {}));
/** Lifecycle state of a subscription. */
export var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["INACTIVE"] = "INACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["TRIALING"] = "TRIALING";
})(SubscriptionStatus || (SubscriptionStatus = {}));
// ─── Content & Learning ───────────────────────────────────────────────────────
/** Distinct types of educational content in the platform. */
export var ContentType;
(function (ContentType) {
    ContentType["VIDEO"] = "VIDEO";
    ContentType["DOCUMENT"] = "DOCUMENT";
    ContentType["QUIZ"] = "QUIZ";
    ContentType["ASSIGNMENT"] = "ASSIGNMENT";
    ContentType["LIVE_SESSION"] = "LIVE_SESSION";
    ContentType["AUDIO"] = "AUDIO";
    ContentType["SCORM"] = "SCORM";
})(ContentType || (ContentType = {}));
/** Lifecycle of a student assignment submission. */
export var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["PENDING"] = "PENDING";
    AssignmentStatus["SUBMITTED"] = "SUBMITTED";
    AssignmentStatus["GRADED"] = "GRADED";
    AssignmentStatus["RETURNED"] = "RETURNED";
})(AssignmentStatus || (AssignmentStatus = {}));
/** Status of a live classroom / webinar session. */
export var LiveSessionStatus;
(function (LiveSessionStatus) {
    LiveSessionStatus["SCHEDULED"] = "SCHEDULED";
    LiveSessionStatus["LIVE"] = "LIVE";
    LiveSessionStatus["ENDED"] = "ENDED";
    LiveSessionStatus["CANCELLED"] = "CANCELLED";
})(LiveSessionStatus || (LiveSessionStatus = {}));
// ─── Notifications ────────────────────────────────────────────────────────────
/** Delivery channel for a notification. */
export var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["IN_APP"] = "IN_APP";
})(NotificationType || (NotificationType = {}));
/** Read / delivery state of a single notification record. */
export var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["UNREAD"] = "UNREAD";
    NotificationStatus["READ"] = "READ";
    NotificationStatus["ARCHIVED"] = "ARCHIVED";
    NotificationStatus["FAILED"] = "FAILED";
})(NotificationStatus || (NotificationStatus = {}));
// ─── Payments ─────────────────────────────────────────────────────────────────
/** State of a payment transaction. */
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (PaymentStatus = {}));
/** Supported payment gateway providers. */
export var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["STRIPE"] = "STRIPE";
    PaymentProvider["PAYPAL"] = "PAYPAL";
    PaymentProvider["MANUAL"] = "MANUAL";
})(PaymentProvider || (PaymentProvider = {}));
// ─── Audit & Compliance ───────────────────────────────────────────────────────
/** Actions recorded in the immutable audit log. */
export var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["VIEW"] = "VIEW";
    AuditAction["EXPORT"] = "EXPORT";
    AuditAction["IMPORT"] = "IMPORT";
    AuditAction["ENROLL"] = "ENROLL";
    AuditAction["UNENROLL"] = "UNENROLL";
    AuditAction["SUBMIT"] = "SUBMIT";
    AuditAction["GRADE"] = "GRADE";
    AuditAction["APPROVE"] = "APPROVE";
    AuditAction["REJECT"] = "REJECT";
    AuditAction["PUBLISH"] = "PUBLISH";
    AuditAction["UNPUBLISH"] = "UNPUBLISH";
})(AuditAction || (AuditAction = {}));
// ─── AI Module Types ──────────────────────────────────────────────────────────
/**
 * All 17 AI-powered modules available in the EduAI Ultimate platform.
 * Each value maps to a dedicated system prompt and service implementation.
 */
export var AIModuleType;
(function (AIModuleType) {
    /** Adaptive 1-on-1 tutoring agent that explains concepts and answers questions. */
    AIModuleType["TUTOR"] = "TUTOR";
    /** Guides students step-by-step through homework without giving direct answers. */
    AIModuleType["HOMEWORK_ASSISTANT"] = "HOMEWORK_ASSISTANT";
    /** Generates quizzes and exams from course material with configurable difficulty. */
    AIModuleType["EXAM_GENERATOR"] = "EXAM_GENERATOR";
    /** Creates structured lesson plans from topic keywords and learning objectives. */
    AIModuleType["LESSON_GENERATOR"] = "LESSON_GENERATOR";
    /** Builds full course curricula including learning paths and milestones. */
    AIModuleType["CURRICULUM_GENERATOR"] = "CURRICULUM_GENERATOR";
    /** Converts notes or text into spaced-repetition flashcard decks. */
    AIModuleType["FLASHCARDS"] = "FLASHCARDS";
    /** Generates interactive visual mind maps from topics or documents. */
    AIModuleType["MIND_MAP"] = "MIND_MAP";
    /** Research helper that summarises sources, cites references, and avoids hallucinations. */
    AIModuleType["RESEARCH_ASSISTANT"] = "RESEARCH_ASSISTANT";
    /** Translates educational content into 50+ languages with pedagogical accuracy. */
    AIModuleType["TRANSLATOR"] = "TRANSLATOR";
    /** Converts recorded or live speech to accurate, punctuated transcripts. */
    AIModuleType["SPEECH_TO_TEXT"] = "SPEECH_TO_TEXT";
    /** Synthesises natural-sounding audio from lesson text with voice options. */
    AIModuleType["TEXT_TO_SPEECH"] = "TEXT_TO_SPEECH";
    /** Personalised content and course recommendations based on learner history. */
    AIModuleType["RECOMMENDATION"] = "RECOMMENDATION";
    /** Maps student skills to career pathways and recommends upskilling courses. */
    AIModuleType["CAREER_ADVISOR"] = "CAREER_ADVISOR";
    /** Predicts student academic performance from engagement and assessment data. */
    AIModuleType["PERFORMANCE_PREDICTION"] = "PERFORMANCE_PREDICTION";
    /** Identifies students at risk of dropping out using behavioural signals. */
    AIModuleType["DROPOUT_PREDICTION"] = "DROPOUT_PREDICTION";
    /** Flags inappropriate or policy-violating content in submissions and messages. */
    AIModuleType["CONTENT_MODERATION"] = "CONTENT_MODERATION";
    /** Detects AI-generated or plagiarised content in student submissions. */
    AIModuleType["PLAGIARISM_DETECTION"] = "PLAGIARISM_DETECTION";
})(AIModuleType || (AIModuleType = {}));
// ─── File & Media ─────────────────────────────────────────────────────────────
/** Storage provider used for a given file upload. */
export var StorageProvider;
(function (StorageProvider) {
    StorageProvider["S3"] = "S3";
    StorageProvider["MINIO"] = "MINIO";
    StorageProvider["CLOUDFLARE_R2"] = "CLOUDFLARE_R2";
    StorageProvider["LOCAL"] = "LOCAL";
})(StorageProvider || (StorageProvider = {}));
/** Processing state of an uploaded file (e.g. video transcoding). */
export var FileStatus;
(function (FileStatus) {
    FileStatus["UPLOADING"] = "UPLOADING";
    FileStatus["PROCESSING"] = "PROCESSING";
    FileStatus["READY"] = "READY";
    FileStatus["FAILED"] = "FAILED";
    FileStatus["DELETED"] = "DELETED";
})(FileStatus || (FileStatus = {}));
// ─── Course & Enrollment ──────────────────────────────────────────────────────
/** Publication state of a course. */
export var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "DRAFT";
    CourseStatus["REVIEW"] = "REVIEW";
    CourseStatus["PUBLISHED"] = "PUBLISHED";
    CourseStatus["ARCHIVED"] = "ARCHIVED";
})(CourseStatus || (CourseStatus = {}));
/** Student's progress state in an enrolled course. */
export var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["ACTIVE"] = "ACTIVE";
    EnrollmentStatus["COMPLETED"] = "COMPLETED";
    EnrollmentStatus["WITHDRAWN"] = "WITHDRAWN";
    EnrollmentStatus["SUSPENDED"] = "SUSPENDED";
})(EnrollmentStatus || (EnrollmentStatus = {}));
// ─── Language & Localisation ──────────────────────────────────────────────────
/** ISO 639-1 language codes supported on the platform. */
export var SupportedLanguage;
(function (SupportedLanguage) {
    SupportedLanguage["EN"] = "en";
    SupportedLanguage["AR"] = "ar";
    SupportedLanguage["ZH"] = "zh";
    SupportedLanguage["ES"] = "es";
    SupportedLanguage["FR"] = "fr";
    SupportedLanguage["DE"] = "de";
    SupportedLanguage["HI"] = "hi";
    SupportedLanguage["ID"] = "id";
    SupportedLanguage["IT"] = "it";
    SupportedLanguage["JA"] = "ja";
    SupportedLanguage["KO"] = "ko";
    SupportedLanguage["MS"] = "ms";
    SupportedLanguage["NL"] = "nl";
    SupportedLanguage["PL"] = "pl";
    SupportedLanguage["PT"] = "pt";
    SupportedLanguage["RU"] = "ru";
    SupportedLanguage["SV"] = "sv";
    SupportedLanguage["TR"] = "tr";
    SupportedLanguage["UK"] = "uk";
    SupportedLanguage["UR"] = "ur";
    SupportedLanguage["VI"] = "vi";
})(SupportedLanguage || (SupportedLanguage = {}));
