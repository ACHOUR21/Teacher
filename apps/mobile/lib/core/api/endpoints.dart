class Endpoints {
  Endpoints._();

  static const String baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.eduai.example.com/v1');

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyMfa = '/auth/mfa/verify';
  static const String setupMfa = '/auth/mfa/setup';
  static const String me = '/auth/me';

  // Courses
  static const String courses = '/courses';
  static String courseById(String id) => '/courses/$id';
  static String courseEnroll(String id) => '/courses/$id/enroll';
  static String courseLessons(String id) => '/courses/$id/lessons';
  static String lessonById(String courseId, String lessonId) =>
      '/courses/$courseId/lessons/$lessonId';
  static String lessonProgress(String courseId, String lessonId) =>
      '/courses/$courseId/lessons/$lessonId/progress';
  static String courseReviews(String id) => '/courses/$id/reviews';
  static const String enrolledCourses = '/courses/enrolled';
  static const String courseCategories = '/courses/categories';

  // Dashboard
  static const String dashboardStats = '/dashboard/stats';
  static const String recentCourses = '/dashboard/recent-courses';
  static const String aiRecommendations = '/dashboard/recommendations';

  // Live Sessions
  static const String liveSessions = '/live-sessions';
  static String liveSessionById(String id) => '/live-sessions/$id';
  static String liveSessionJoin(String id) => '/live-sessions/$id/join';
  static String liveSessionLeave(String id) => '/live-sessions/$id/leave';
  static String liveSessionParticipants(String id) =>
      '/live-sessions/$id/participants';

  // AI Tutor
  static const String aiConversations = '/ai/conversations';
  static String aiConversationById(String id) => '/ai/conversations/$id';
  static String aiConversationMessages(String id) =>
      '/ai/conversations/$id/messages';
  static const String aiChat = '/ai/chat';
  static const String aiGenerate = '/ai/generate';
  static const String aiSubjects = '/ai/subjects';

  // Profile
  static const String profile = '/profile';
  static const String updateProfile = '/profile/update';
  static const String uploadAvatar = '/profile/avatar';
  static const String userStats = '/profile/stats';
  static const String achievements = '/profile/achievements';
  static const String certificates = '/profile/certificates';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationById(String id) => '/notifications/$id';
  static const String markAllRead = '/notifications/mark-all-read';
  static String markRead(String id) => '/notifications/$id/read';
  static const String fcmToken = '/notifications/fcm-token';
}
