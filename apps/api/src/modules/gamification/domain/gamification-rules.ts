export type GamificationEventType =
  | 'lesson_completed'
  | 'assignment_submitted'
  | 'assignment_graded_pass'
  | 'course_completed'
  | 'daily_login'
  | 'streak_7'
  | 'streak_30'
  | 'first_lesson'
  | 'first_course_enrolled'
  | 'profile_completed'
  | 'peer_review_given';

export interface GamificationRule {
  eventType: GamificationEventType;
  xp: number;
  /** Fire at most once ever per user */
  once?: boolean;
  /** Fire at most N times per calendar day */
  dailyCap?: number;
}

export const GAMIFICATION_RULES: GamificationRule[] = [
  { eventType: 'lesson_completed',        xp: 10,  dailyCap: 20 },
  { eventType: 'assignment_submitted',    xp: 15,  dailyCap: 5  },
  { eventType: 'assignment_graded_pass',  xp: 25,  dailyCap: 5  },
  { eventType: 'course_completed',        xp: 150 },
  { eventType: 'daily_login',             xp: 5,   dailyCap: 1  },
  { eventType: 'streak_7',               xp: 50 },
  { eventType: 'streak_30',              xp: 200 },
  { eventType: 'first_lesson',            xp: 30,  once: true   },
  { eventType: 'first_course_enrolled',   xp: 20,  once: true   },
  { eventType: 'profile_completed',       xp: 50,  once: true   },
  { eventType: 'peer_review_given',       xp: 10,  dailyCap: 3  },
];

export const RULES_MAP = new Map<GamificationEventType, GamificationRule>(
  GAMIFICATION_RULES.map(r => [r.eventType, r]),
);
