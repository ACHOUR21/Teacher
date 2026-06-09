class Endpoints {
  Endpoints._();

  static const String baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.eduai.example.com/v1');

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  /// Tenant self-registration: creates the tenant and the first owner account.
  static const String tenantRegister = '/auth/tenant/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyMfa = '/auth/mfa/verify';
  /// MFA challenge endpoint used when the login response returns requires_mfa.
  static const String mfaChallenge = '/auth/mfa/challenge';
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
  /// PUT /courses/:courseId/progress — update course-level progress for the
  /// current user.
  static String courseProgress(String courseId) => '/courses/$courseId/progress';
  static String courseReviews(String id) => '/courses/$id/reviews';
  static const String enrolledCourses = '/courses/enrolled';
  static const String courseCategories = '/courses/categories';

  // Students (self)
  /// GET /students/me/progress — enrollment + progress list for the current student.
  static const String studentMeProgress = '/students/me/progress';
  /// GET /students/me/performance — aggregated performance analytics.
  static const String studentMePerformance = '/students/me/performance';

  // Dashboard
  static const String dashboardStats = '/dashboard/stats';
  static const String recentCourses = '/dashboard/recent-courses';
  static const String aiRecommendations = '/dashboard/recommendations';

  // Live Sessions
  static const String liveSessions = '/live/sessions';
  static String liveSessionById(String id) => '/live/sessions/$id';
  static String liveSessionJoin(String id) => '/live/sessions/$id/join';
  static String liveSessionLeave(String id) => '/live/sessions/$id/leave';
  static String liveSessionParticipants(String id) =>
      '/live/sessions/$id/participants';

  // AI Tutor
  static const String aiConversations = '/ai/conversations';
  static String aiConversationById(String id) => '/ai/conversations/$id';
  static String aiConversationMessages(String id) =>
      '/ai/conversations/$id/messages';
  static const String aiChat = '/ai/chat';
  /// POST /ai/tutor/chat — multi-turn AI tutor conversation.
  static const String aiTutorChat = '/ai/tutor/chat';
  /// POST /ai/homework/solve — step-by-step homework solver.
  static const String aiHomeworkSolve = '/ai/homework/solve';
  /// POST /ai/flashcards/generate — generate flashcard sets from a topic.
  static const String aiFlashcardsGenerate = '/ai/flashcards/generate';
  /// POST /ai/translate — translate text into a target language.
  static const String aiTranslate = '/ai/translate';
  static const String aiGenerate = '/ai/generate';
  static const String aiSubjects = '/ai/subjects';

  // Profile
  static const String profile = '/profile';
  static const String updateProfile = '/profile/update';
  static const String uploadAvatar = '/profile/avatar';
  static const String userStats = '/profile/stats';
  static const String profileAchievements = '/profile/achievements';
  static const String certificates = '/profile/certificates';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationById(String id) => '/notifications/$id';
  static const String markAllRead = '/notifications/mark-all-read';
  static String markRead(String id) => '/notifications/$id/read';
  static const String fcmToken = '/notifications/fcm-token';
  static String markNotificationRead(String id) => '/notifications/$id/read';
  static const String markAllNotificationsRead = '/notifications/mark-all-read';
  /// GET /notifications/unread-count — returns `{"count": <int>}`.
  static const String notificationsUnreadCount = '/notifications/unread-count';

  // Gamification
  static const String gamificationStats = '/gamification/stats';
  static const String achievements = '/gamification/achievements';
  static const String leaderboard = '/gamification/leaderboard';
  static const String userPoints = '/gamification/my-points';
  /// GET /gamification/me — current user's badges, points, streak, achievements.
  static const String gamificationMe = '/gamification/me';

  // Certificates
  static const String myCertificates = '/certificates/my';
  static String downloadCertificate(String id) => '/certificates/$id/download';

  // Marketplace
  static const String marketplaceCourses = '/marketplace/courses';
  static const String featuredCourses = '/marketplace/featured';
  static String purchaseCourse(String id) => '/marketplace/courses/$id/purchase';

  // Assignments
  static const String assignments = '/assignments';
  static String assignmentById(String id) => '/assignments/$id';
  static String assignmentSubmit(String id) => '/assignments/$id/submit';
  /// GET /assignments/:id/my-submission — the current user's submission.
  static String assignmentMySubmission(String id) =>
      '/assignments/$id/my-submission';

  // Messages / Conversations
  static const String messageConversations = '/messages/conversations';
  static String conversationById(String id) => '/messages/conversations/$id';
  static String conversationMessages(String id) =>
      '/messages/conversations/$id/messages';

  // Parents
  static const String myChildren = '/parents/my-children';
  static String childCourses(String id) => '/students/$id/courses';
}
