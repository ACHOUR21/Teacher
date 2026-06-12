import 'package:dio/dio.dart';

/// Aggregated home-screen data fetched in a single parallel request burst.
class HomeData {
  final String userName;
  final int streak;
  final List<InProgressCourse> inProgressCourses;
  final List<Achievement> recentAchievements;

  const HomeData({
    required this.userName,
    required this.streak,
    required this.inProgressCourses,
    required this.recentAchievements,
  });

  factory HomeData.fromResponses(List<Response<dynamic>> responses) {
    // responses[0] → profile
    // responses[1] → in-progress courses
    // responses[2] → gamification streak
    // responses[3] → recent achievements

    // --- Profile ---
    String userName = 'Learner';
    try {
      final profileData = _unwrap(responses[0].data);
      final firstName = profileData['firstName'] as String? ??
          profileData['first_name'] as String? ??
          profileData['name'] as String? ??
          '';
      final lastName = profileData['lastName'] as String? ??
          profileData['last_name'] as String? ??
          '';
      userName = '$firstName $lastName'.trim();
      if (userName.isEmpty) userName = 'Learner';
    } catch (_) {}

    // --- Streak ---
    int streak = 0;
    try {
      final streakData = _unwrap(responses[2].data);
      streak = (streakData['streak'] as num?)?.toInt() ??
          (streakData['currentStreak'] as num?)?.toInt() ??
          (streakData['current'] as num?)?.toInt() ??
          0;
    } catch (_) {}

    // --- In-progress courses ---
    final List<InProgressCourse> courses = [];
    try {
      final coursesData = _unwrapList(responses[1].data);
      for (final item in coursesData) {
        if (item is Map<String, dynamic>) {
          courses.add(InProgressCourse.fromJson(item));
        }
      }
    } catch (_) {}

    // --- Recent achievements ---
    final List<Achievement> achievements = [];
    try {
      final achData = _unwrapList(responses[3].data);
      for (final item in achData) {
        if (item is Map<String, dynamic>) {
          achievements.add(Achievement.fromJson(item));
        }
      }
    } catch (_) {}

    return HomeData(
      userName: userName,
      streak: streak,
      inProgressCourses: courses,
      recentAchievements: achievements,
    );
  }

  static Map<String, dynamic> _unwrap(dynamic data) {
    if (data is Map<String, dynamic>) {
      return (data['data'] as Map<String, dynamic>?) ?? data;
    }
    return {};
  }

  static List<dynamic> _unwrapList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      final inner = data['data'];
      if (inner is List) return inner;
      if (inner is Map<String, dynamic>) {
        final items =
            inner['items'] ?? inner['data'] ?? inner['courses'] ?? inner['results'];
        if (items is List) return items;
      }
    }
    return [];
  }
}

class InProgressCourse {
  final String id;
  final String title;
  final double progressPercent;
  final String? coverImageUrl;

  const InProgressCourse({
    required this.id,
    required this.title,
    required this.progressPercent,
    this.coverImageUrl,
  });

  factory InProgressCourse.fromJson(Map<String, dynamic> json) {
    final rawProgress = json['progress'] ?? json['progressPercent'] ?? json['progressPercentage'] ?? 0;
    double progress = 0;
    if (rawProgress is num) {
      progress = rawProgress.toDouble();
      // Normalise: API may return 0-1 or 0-100
      if (progress > 1.0) progress = progress / 100.0;
    }

    return InProgressCourse(
      id: json['id']?.toString() ?? json['courseId']?.toString() ?? '',
      title: json['title']?.toString() ?? json['courseName']?.toString() ?? '',
      progressPercent: progress.clamp(0.0, 1.0),
      coverImageUrl: json['thumbnailUrl']?.toString() ??
          json['coverImageUrl']?.toString() ??
          json['thumbnail']?.toString(),
    );
  }
}

class Achievement {
  final String id;
  final String name;
  final String icon;
  final String? description;

  const Achievement({
    required this.id,
    required this.name,
    required this.icon,
    this.description,
  });

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['title']?.toString() ?? 'Achievement',
      icon: json['icon']?.toString() ?? '\u{1F3C6}',
      description: json['description']?.toString(),
    );
  }
}
