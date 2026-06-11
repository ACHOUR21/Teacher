import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/api/endpoints.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../gamification/presentation/widgets/xp_progress_bar.dart';
import '../widgets/stats_card.dart';
import '../widgets/course_progress_card.dart';

// Dashboard data models
class DashboardStats {
  final int enrolledCourses;
  final int completedCourses;
  final int upcomingSessions;
  final int totalPoints;

  const DashboardStats({
    required this.enrolledCourses,
    required this.completedCourses,
    required this.upcomingSessions,
    required this.totalPoints,
  });
}

class RecentCourse {
  final String id;
  final String title;
  final String instructor;
  final double progress;
  final String? thumbnailUrl;
  final String? nextLesson;

  const RecentCourse({
    required this.id,
    required this.title,
    required this.instructor,
    required this.progress,
    this.thumbnailUrl,
    this.nextLesson,
  });
}

class UpcomingSession {
  final String id;
  final String title;
  final String instructor;
  final DateTime startsAt;
  final int participantCount;

  const UpcomingSession({
    required this.id,
    required this.title,
    required this.instructor,
    required this.startsAt,
    required this.participantCount,
  });
}

class AIRecommendation {
  final String id;
  final String title;
  final String reason;
  final String category;

  const AIRecommendation({
    required this.id,
    required this.title,
    required this.reason,
    required this.category,
  });
}

// Lightweight gamification summary for the dashboard profile section
final _dashboardXpProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.dio.get('${Endpoints.baseUrl}${Endpoints.gamificationStats}');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return (data['data'] as Map<String, dynamic>?) ?? data;
    }
  } catch (_) {}
  return {};
});

final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStats>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('${Endpoints.baseUrl}${Endpoints.dashboardStats}');
  final data = (response.data['data'] ?? response.data) as Map<String, dynamic>;
  return DashboardStats(
    enrolledCourses: (data['enrolledCourses'] as num?)?.toInt() ?? 0,
    completedCourses: (data['completedCourses'] as num?)?.toInt() ?? 0,
    upcomingSessions: (data['upcomingSessions'] as num?)?.toInt() ?? 0,
    totalPoints: (data['totalPoints'] as num?)?.toInt() ?? 0,
  );
});

final recentCoursesProvider = FutureProvider.autoDispose<List<RecentCourse>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('${Endpoints.baseUrl}${Endpoints.recentCourses}');
  final list = ((response.data['data'] ?? response.data) as List<dynamic>);
  return list.map((item) {
    final m = item as Map<String, dynamic>;
    return RecentCourse(
      id: m['id']?.toString() ?? '',
      title: m['title']?.toString() ?? '',
      instructor: m['instructor']?.toString() ?? '',
      progress: (m['progress'] as num?)?.toDouble() ?? 0.0,
      thumbnailUrl: m['thumbnailUrl']?.toString(),
      nextLesson: m['nextLesson']?.toString(),
    );
  }).toList();
});

final upcomingSessionsProvider =
    FutureProvider.autoDispose<List<UpcomingSession>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('${Endpoints.baseUrl}/dashboard/upcoming-sessions');
  final list = ((response.data['data'] ?? response.data) as List<dynamic>);
  return list.map((item) {
    final m = item as Map<String, dynamic>;
    return UpcomingSession(
      id: m['id']?.toString() ?? '',
      title: m['title']?.toString() ?? '',
      instructor: m['instructor']?.toString() ?? '',
      startsAt: DateTime.tryParse(m['startsAt']?.toString() ?? '') ?? DateTime.now(),
      participantCount: (m['participantCount'] as num?)?.toInt() ?? 0,
    );
  }).toList();
});

final aiRecommendationsProvider =
    FutureProvider.autoDispose<List<AIRecommendation>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('${Endpoints.baseUrl}${Endpoints.aiRecommendations}');
  final list = ((response.data['data'] ?? response.data) as List<dynamic>);
  return list.map((item) {
    final m = item as Map<String, dynamic>;
    return AIRecommendation(
      id: m['id']?.toString() ?? '',
      title: m['title']?.toString() ?? '',
      reason: m['reason']?.toString() ?? '',
      category: m['category']?.toString() ?? '',
    );
  }).toList();
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  String _formatSessionTime(DateTime dt) {
    final now = DateTime.now();
    final diff = dt.difference(now);
    if (diff.inHours < 1) return 'In ${diff.inMinutes}m';
    if (diff.inHours < 24) return 'In ${diff.inHours}h ${diff.inMinutes.remainder(60)}m';
    return 'Tomorrow ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = ref.watch(currentUserProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);
    final recentCoursesAsync = ref.watch(recentCoursesProvider);
    final sessionsAsync = ref.watch(upcomingSessionsProvider);
    final recommendationsAsync = ref.watch(aiRecommendationsProvider);
    final xpAsync = ref.watch(_dashboardXpProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: colorScheme.primary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  user?.initials ?? 'U',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back,',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.textTheme.bodySmall?.color,
                  ),
                ),
                Text(
                  user?.firstName ?? 'Learner',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // XP progress bar (compact) in AppBar
          xpAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (xpData) {
              final level = (xpData['level'] as num?)?.toInt() ?? 1;
              final xpProgress = xpData['xpProgress'] as Map<String, dynamic>?;
              final currentXp = (xpProgress?['current'] as num?)?.toInt() ??
                  (xpData['currentXp'] as num?)?.toInt() ?? 0;
              final nextLevelXp = (xpProgress?['needed'] as num?)?.toInt() ??
                  (xpData['nextLevelXp'] as num?)?.toInt() ?? 100;
              return Padding(
                padding: const EdgeInsets.only(right: 4),
                child: GestureDetector(
                  onTap: () => context.go('/home/gamification'),
                  child: XpProgressBar(
                    level: level,
                    currentXp: currentXp,
                    nextLevelXp: nextLevelXp,
                    compact: true,
                  ),
                ),
              );
            },
          ),
          IconButton(
            onPressed: () => context.go('/home/notifications'),
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_outlined),
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: colorScheme.error,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardStatsProvider);
          ref.invalidate(recentCoursesProvider);
          ref.invalidate(upcomingSessionsProvider);
          ref.invalidate(aiRecommendationsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            // Stats section
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: statsAsync.when(
                loading: () => GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: List.generate(
                    4,
                    (_) => const ShimmerLoading(
                      width: double.infinity,
                      height: double.infinity,
                      borderRadius: 16,
                    ),
                  ),
                ),
                error: (e, _) => const SizedBox.shrink(),
                data: (stats) => GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    StatsCard(
                      label: 'Enrolled',
                      value: stats.enrolledCourses.toString(),
                      icon: Icons.menu_book_rounded,
                      color: AppTheme.primaryLight,
                    ),
                    StatsCard(
                      label: 'Completed',
                      value: stats.completedCourses.toString(),
                      icon: Icons.check_circle_rounded,
                      color: AppTheme.success,
                    ),
                    StatsCard(
                      label: 'Live Sessions',
                      value: stats.upcomingSessions.toString(),
                      icon: Icons.live_tv_rounded,
                      color: AppTheme.secondary,
                      subtitle: 'Upcoming',
                    ),
                    StatsCard(
                      label: 'Points',
                      value: stats.totalPoints.toString(),
                      icon: Icons.stars_rounded,
                      color: AppTheme.warning,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Continue Learning
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    'Continue Learning',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.go('/home/courses'),
                    child: const Text('See All'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 260,
              child: recentCoursesAsync.when(
                loading: () => ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: 3,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, __) => const ShimmerLoading(
                    width: 240,
                    height: 260,
                    borderRadius: 16,
                  ),
                ),
                error: (e, _) => const Center(child: Text('Could not load courses')),
                data: (courses) => ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: courses.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, i) {
                    final c = courses[i];
                    return CourseProgressCard(
                      courseId: c.id,
                      title: c.title,
                      instructor: c.instructor,
                      progress: c.progress,
                      thumbnailUrl: c.thumbnailUrl,
                      nextLesson: c.nextLesson,
                      onTap: () => context.go('/home/courses/${c.id}'),
                    );
                  },
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Upcoming Live Sessions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    'Upcoming Sessions',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => context.go('/home/live'),
                    child: const Text('See All'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            sessionsAsync.when(
              loading: () => Column(
                children: List.generate(
                  2,
                  (_) => const Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: ListItemShimmer(),
                  ),
                ),
              ),
              error: (e, _) => const SizedBox.shrink(),
              data: (sessions) => sessions.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('No upcoming sessions'),
                    )
                  : Column(
                      children: sessions.map((s) {
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                          child: _UpcomingSessionCard(
                            session: s,
                            timeLabel: _formatSessionTime(s.startsAt),
                            onJoin: () =>
                                context.go('/home/live/${s.id}'),
                          ),
                        );
                      }).toList(),
                    ),
            ),

            const SizedBox(height: 28),

            // AI Recommendations
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.primaryLight,
                          AppTheme.secondary,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      size: 16,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'AI Recommendations',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            recommendationsAsync.when(
              loading: () => Column(
                children: List.generate(
                  3,
                  (_) => const Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: ListItemShimmer(),
                  ),
                ),
              ),
              error: (e, _) => const SizedBox.shrink(),
              data: (recs) => Column(
                children: recs.map((r) {
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: _RecommendationCard(
                      recommendation: r,
                      onTap: () => context.go('/home/courses'),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingSessionCard extends StatelessWidget {
  final UpcomingSession session;
  final String timeLabel;
  final VoidCallback onJoin;

  const _UpcomingSessionCard({
    required this.session,
    required this.timeLabel,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.secondary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.live_tv_rounded,
              color: AppTheme.secondary,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  session.instructor,
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 12,
                      color: colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      timeLabel,
                      style: TextStyle(
                        fontSize: 11,
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Icon(
                      Icons.people_outline,
                      size: 12,
                      color: theme.textTheme.bodySmall?.color,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${session.participantCount}',
                      style: theme.textTheme.labelSmall,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: onJoin,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  final AIRecommendation recommendation;
  final VoidCallback onTap;

  const _RecommendationCard({
    required this.recommendation,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryLight, AppTheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.auto_awesome,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recommendation.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    recommendation.reason,
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      recommendation.category,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppTheme.primaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          ],
        ),
      ),
    );
  }
}
