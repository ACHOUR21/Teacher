import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/api/endpoints.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _gamificationStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  const storage = FlutterSecureStorage();
  final token = await storage.read(key: 'access_token');
  final dio = Dio();
  final response = await dio.get(
    '${Endpoints.baseUrl}${Endpoints.gamificationStats}',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
  );
  final data = response.data;
  if (data is Map<String, dynamic>) {
    return (data['data'] as Map<String, dynamic>?) ?? data;
  }
  return {};
});

final _achievementsProvider = FutureProvider<List<dynamic>>((ref) async {
  const storage = FlutterSecureStorage();
  final token = await storage.read(key: 'access_token');
  final dio = Dio();
  final response = await dio.get(
    '${Endpoints.baseUrl}${Endpoints.achievements}',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
  );
  final data = response.data;
  if (data is Map<String, dynamic>) {
    final inner = data['data'];
    if (inner is List) return inner;
    if (inner is Map<String, dynamic>) {
      final items = inner['items'] ?? inner['data'];
      if (items is List) return items;
    }
  }
  return [];
});

final _leaderboardProvider = FutureProvider<List<dynamic>>((ref) async {
  const storage = FlutterSecureStorage();
  final token = await storage.read(key: 'access_token');
  final dio = Dio();
  final response = await dio.get(
    '${Endpoints.baseUrl}${Endpoints.leaderboard}',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
  );
  final data = response.data;
  if (data is Map<String, dynamic>) {
    final inner = data['data'];
    if (inner is List) return inner;
    if (inner is Map<String, dynamic>) {
      final items = inner['items'] ?? inner['data'];
      if (items is List) return items;
    }
  }
  return [];
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class GamificationScreen extends ConsumerWidget {
  const GamificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(_gamificationStatsProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 210,
              pinned: true,
              backgroundColor: Colors.deepPurple,
              flexibleSpace: FlexibleSpaceBar(
                background: _PointsHero(statsAsync: statsAsync),
              ),
              bottom: const TabBar(
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                tabs: [
                  Tab(text: 'Stats'),
                  Tab(text: 'Achievements'),
                  Tab(text: 'Leaderboard'),
                ],
              ),
            ),
          ],
          body: TabBarView(
            children: [
              _StatsTab(statsAsync: statsAsync),
              _AchievementsTab(achievementsAsync: ref.watch(_achievementsProvider), onRetry: () => ref.invalidate(_achievementsProvider)),
              _LeaderboardTab(leaderboardAsync: ref.watch(_leaderboardProvider), onRetry: () => ref.invalidate(_leaderboardProvider)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Points Hero
// ---------------------------------------------------------------------------

class _PointsHero extends StatelessWidget {
  final AsyncValue<Map<String, dynamic>> statsAsync;
  const _PointsHero({required this.statsAsync});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF7B1FA2), Color(0xFF512DA8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        child: statsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
          error: (_, __) => const Center(
            child: Text('Unable to load stats', style: TextStyle(color: Colors.white70)),
          ),
          data: (stats) {
            final points = stats['totalPoints'] ?? stats['points'] ?? 0;
            final rank = stats['rank'] ?? stats['weeklyRank'] ?? '--';
            final level = stats['level'] ?? 1;
            final xp = (stats['xp'] ?? stats['currentXp'] ?? 0) as num;
            final xpNext = (stats['xpToNextLevel'] ?? stats['nextLevelXp'] ?? 1000) as num;
            final progress = xpNext > 0 ? (xp / xpNext).clamp(0.0, 1.0).toDouble() : 0.0;

            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 16),
                const Text('\u{1F3C6}', style: TextStyle(fontSize: 36)),
                const SizedBox(height: 6),
                Text(
                  '$points Points',
                  style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Level $level  |  Rank #$rank',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: progress,
                          backgroundColor: Colors.white24,
                          color: Colors.white,
                          minHeight: 8,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$xp / $xpNext XP to Level ${level + 1}',
                        style: const TextStyle(color: Colors.white54, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Stats Tab
// ---------------------------------------------------------------------------

class _StatsTab extends StatelessWidget {
  final AsyncValue<Map<String, dynamic>> statsAsync;
  const _StatsTab({required this.statsAsync});

  @override
  Widget build(BuildContext context) {
    return statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: null),
      data: (stats) {
        final points = stats['totalPoints'] ?? stats['points'] ?? 0;
        final rank = stats['rank'] ?? stats['weeklyRank'] ?? '--';
        final streak = stats['streak'] ?? stats['currentStreak'] ?? 0;
        final level = stats['level'] ?? 1;
        final xp = (stats['xp'] ?? stats['currentXp'] ?? 0) as num;
        final xpNext = (stats['xpToNextLevel'] ?? stats['nextLevelXp'] ?? 1000) as num;
        final progress = xpNext > 0 ? (xp / xpNext).clamp(0.0, 1.0).toDouble() : 0.0;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // XP progress card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Level $level',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.deepPurple.shade50,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Rank #$rank',
                            style: const TextStyle(
                              color: Colors.deepPurple,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.deepPurple.shade50,
                        color: Colors.deepPurple,
                        minHeight: 10,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '$xp / $xpNext XP to Level ${level + 1}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _SectionTitle('Overview'),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    label: 'Total Points',
                    value: '$points',
                    icon: Icons.star_rounded,
                    color: Colors.amber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'Day Streak',
                    value: '$streak',
                    icon: Icons.local_fire_department,
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'Global Rank',
                    value: '#$rank',
                    icon: Icons.emoji_events,
                    color: Colors.deepPurple,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Achievements Tab
// ---------------------------------------------------------------------------

class _AchievementsTab extends StatelessWidget {
  final AsyncValue<List<dynamic>> achievementsAsync;
  final VoidCallback onRetry;
  const _AchievementsTab({required this.achievementsAsync, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return achievementsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: onRetry),
      data: (achievements) {
        if (achievements.isEmpty) {
          return const Center(child: Text('No achievements yet.'));
        }
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: achievements.length,
          itemBuilder: (context, i) {
            final item = achievements[i] as Map<String, dynamic>;
            final earned = item['earned'] == true ||
                item['earnedAt'] != null ||
                item['isEarned'] == true;
            final name = item['name'] as String? ?? item['title'] as String? ?? 'Achievement';
            final description = item['description'] as String? ?? '';
            final xpValue = item['xpValue'] ?? item['points'] ?? item['xp'] ?? 0;
            final icon = item['icon'] as String? ?? '\u{1F3C6}';

            return Opacity(
              opacity: earned ? 1.0 : 0.4,
              child: Card(
                elevation: earned ? 2 : 0,
                color: earned ? Colors.white : Colors.grey.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(icon, style: const TextStyle(fontSize: 36)),
                      const SizedBox(height: 8),
                      Text(
                        name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (description.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          description,
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 6),
                      if (earned)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '+$xpValue XP',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.green.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      else
                        Text(
                          '$xpValue XP',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Leaderboard Tab
// ---------------------------------------------------------------------------

class _LeaderboardTab extends ConsumerWidget {
  final AsyncValue<List<dynamic>> leaderboardAsync;
  final VoidCallback onRetry;
  const _LeaderboardTab({required this.leaderboardAsync, required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return leaderboardAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: onRetry),
      data: (entries) {
        if (entries.isEmpty) {
          return const Center(child: Text('No leaderboard data.'));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: entries.length,
          separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
          itemBuilder: (context, i) {
            final entry = entries[i] as Map<String, dynamic>;
            final name = entry['name'] as String? ??
                entry['displayName'] as String? ??
                entry['username'] as String? ??
                'User';
            final points = entry['points'] ?? entry['totalPoints'] ?? entry['xp'] ?? 0;
            final isCurrentUser = entry['isCurrentUser'] == true || entry['isMe'] == true;
            final initials = name.trim().isNotEmpty
                ? name.trim().split(' ').map((w) => w.isNotEmpty ? w[0] : '').take(2).join().toUpperCase()
                : '?';

            final rank = i + 1;
            final medalColor = rank == 1
                ? const Color(0xFFFFD700)
                : rank == 2
                    ? const Color(0xFFC0C0C0)
                    : rank == 3
                        ? const Color(0xFFCD7F32)
                        : null;

            return Container(
              decoration: BoxDecoration(
                color: isCurrentUser ? Colors.deepPurple.withOpacity(0.08) : null,
                borderRadius: BorderRadius.circular(8),
              ),
              child: ListTile(
                leading: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    CircleAvatar(
                      backgroundColor:
                          isCurrentUser ? Colors.deepPurple : Colors.grey.shade200,
                      child: Text(
                        initials,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isCurrentUser ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                    if (medalColor != null)
                      Positioned(
                        right: -4,
                        bottom: -4,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: medalColor,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: Center(
                            child: Text(
                              '$rank',
                              style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                title: Text(
                  isCurrentUser ? '$name (You)' : name,
                  style: TextStyle(
                    fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
                subtitle: Text(
                  'Rank #$rank',
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: Text(
                  '$points pts',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.deepPurple,
                    fontSize: 13,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Shared Widgets
// ---------------------------------------------------------------------------

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, size: 26, color: color),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(
              'Something went wrong',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
