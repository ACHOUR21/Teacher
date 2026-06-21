"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FEATURE_FLAGS = exports.DEFAULT_FLAGS = void 0;
const FEATURE_FLAGS = exports.FEATURE_FLAGS = {
  // AI Features
  AI_TUTOR: 'ai_tutor',
  AI_EXAM_GENERATOR: 'ai_exam_generator',
  AI_LESSON_GENERATOR: 'ai_lesson_generator',
  AI_FLASHCARD_GENERATOR: 'ai_flashcard_generator',
  AI_PLAGIARISM_DETECTION: 'ai_plagiarism_detection',
  AI_CONTENT_MODERATION: 'ai_content_moderation',
  // Platform Features
  LIVE_SESSIONS: 'live_sessions',
  MARKETPLACE: 'marketplace',
  PLUGIN_MARKETPLACE: 'plugin_marketplace',
  GAMIFICATION: 'gamification',
  CERTIFICATES: 'certificates',
  // Enterprise Features
  WHITE_LABEL: 'white_label',
  CUSTOM_DOMAIN: 'custom_domain',
  SSO_GOOGLE: 'sso_google',
  SSO_MICROSOFT: 'sso_microsoft',
  API_ECOSYSTEM: 'api_ecosystem',
  // Beta Features
  BLOCKCHAIN_CERTS: 'blockchain_certs',
  AR_VR_CONTENT: 'ar_vr_content',
  VOICE_ASSISTANT: 'voice_assistant',
  // Compliance
  GDPR_ENHANCED: 'gdpr_enhanced',
  FERPA_MODE: 'ferpa_mode',
  COPPA_MODE: 'coppa_mode'
};
// Default flag states (can be overridden by env vars or DB)
const DEFAULT_FLAGS = exports.DEFAULT_FLAGS = {
  [FEATURE_FLAGS.AI_TUTOR]: true,
  [FEATURE_FLAGS.AI_EXAM_GENERATOR]: true,
  [FEATURE_FLAGS.AI_LESSON_GENERATOR]: true,
  [FEATURE_FLAGS.AI_FLASHCARD_GENERATOR]: true,
  [FEATURE_FLAGS.AI_PLAGIARISM_DETECTION]: true,
  [FEATURE_FLAGS.AI_CONTENT_MODERATION]: true,
  [FEATURE_FLAGS.LIVE_SESSIONS]: true,
  [FEATURE_FLAGS.MARKETPLACE]: true,
  [FEATURE_FLAGS.PLUGIN_MARKETPLACE]: false,
  [FEATURE_FLAGS.GAMIFICATION]: true,
  [FEATURE_FLAGS.CERTIFICATES]: true,
  [FEATURE_FLAGS.WHITE_LABEL]: true,
  [FEATURE_FLAGS.CUSTOM_DOMAIN]: true,
  [FEATURE_FLAGS.SSO_GOOGLE]: false,
  [FEATURE_FLAGS.SSO_MICROSOFT]: false,
  [FEATURE_FLAGS.API_ECOSYSTEM]: true,
  [FEATURE_FLAGS.BLOCKCHAIN_CERTS]: false,
  [FEATURE_FLAGS.AR_VR_CONTENT]: false,
  [FEATURE_FLAGS.VOICE_ASSISTANT]: false,
  [FEATURE_FLAGS.GDPR_ENHANCED]: true,
  [FEATURE_FLAGS.FERPA_MODE]: false,
  [FEATURE_FLAGS.COPPA_MODE]: false
};