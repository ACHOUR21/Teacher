import { type SubscriptionPlan } from '@prisma/client';

export interface PlanLimits {
  maxStudents: number;
  maxCourses: number;
  storageGb: number;
  aiTutor: boolean;
  aiExamGenerator: boolean;
  liveClassroom: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  customDomain: boolean;
  multiSchool: boolean;
  pluginMarketplace: boolean;
  certificateSystem: boolean;
  parentPortal: boolean;
  gamification: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanLimits> = {
  FREE_TRIAL: {
    maxStudents: 30,
    maxCourses: 5,
    storageGb: 1,
    aiTutor: false,
    aiExamGenerator: false,
    liveClassroom: false,
    whiteLabel: false,
    apiAccess: false,
    advancedAnalytics: false,
    customDomain: false,
    multiSchool: false,
    pluginMarketplace: false,
    certificateSystem: false,
    parentPortal: false,
    gamification: true,
  },
  STARTER: {
    maxStudents: 100,
    maxCourses: 20,
    storageGb: 10,
    aiTutor: true,
    aiExamGenerator: false,
    liveClassroom: false,
    whiteLabel: false,
    apiAccess: false,
    advancedAnalytics: true,
    customDomain: false,
    multiSchool: false,
    pluginMarketplace: false,
    certificateSystem: true,
    parentPortal: true,
    gamification: true,
  },
  PROFESSIONAL: {
    maxStudents: 500,
    maxCourses: -1, // unlimited
    storageGb: 50,
    aiTutor: true,
    aiExamGenerator: true,
    liveClassroom: true,
    whiteLabel: true,
    apiAccess: false,
    advancedAnalytics: true,
    customDomain: true,
    multiSchool: false,
    pluginMarketplace: true,
    certificateSystem: true,
    parentPortal: true,
    gamification: true,
  },
  BUSINESS: {
    maxStudents: 2000,
    maxCourses: -1,
    storageGb: 200,
    aiTutor: true,
    aiExamGenerator: true,
    liveClassroom: true,
    whiteLabel: true,
    apiAccess: true,
    advancedAnalytics: true,
    customDomain: true,
    multiSchool: true,
    pluginMarketplace: true,
    certificateSystem: true,
    parentPortal: true,
    gamification: true,
  },
  ENTERPRISE: {
    maxStudents: -1,
    maxCourses: -1,
    storageGb: -1,
    aiTutor: true,
    aiExamGenerator: true,
    liveClassroom: true,
    whiteLabel: true,
    apiAccess: true,
    advancedAnalytics: true,
    customDomain: true,
    multiSchool: true,
    pluginMarketplace: true,
    certificateSystem: true,
    parentPortal: true,
    gamification: true,
  },
  LIFETIME: {
    maxStudents: 2000,
    maxCourses: -1,
    storageGb: 200,
    aiTutor: true,
    aiExamGenerator: true,
    liveClassroom: true,
    whiteLabel: true,
    apiAccess: true,
    advancedAnalytics: true,
    customDomain: true,
    multiSchool: true,
    pluginMarketplace: true,
    certificateSystem: true,
    parentPortal: true,
    gamification: true,
  },
};

export type PlanFeatureKey = keyof PlanLimits;

/** Returns true if the given plan includes the given boolean feature. */
export function planHasFeature(plan: SubscriptionPlan, feature: PlanFeatureKey): boolean {
  const limits = PLAN_FEATURES[plan];
  const value = limits[feature];
  return typeof value === 'boolean' ? value : (value) !== 0;
}

/** Prices in USD cents for the plan (monthly recurring, or one-time for LIFETIME). */
export const PLAN_PRICE_CENTS: Partial<Record<SubscriptionPlan, number>> = {
  STARTER: 2900,
  PROFESSIONAL: 7900,
  BUSINESS: 19900,
  LIFETIME: 99900,
};
