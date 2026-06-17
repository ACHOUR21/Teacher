import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/endpoints.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Endpoint constant (not yet in Endpoints class)
// ---------------------------------------------------------------------------

const _analyticsStatsPath = '/analytics/stats';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final analyticsStatsProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response =
      await apiClient.dio.get('${Endpoints.baseUrl}$_analyticsStatsPath');
  final data = response.data;
  if (data is Map<String, dynamic>) {
    return (data['data'] as Map<String, dynamic>?) ?? data;
  }
  return {};
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(analyticsStatsProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(analyticsStatsProvider),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: statsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorRetry(
          message: e.toString(),
          onRetry: () => ref.invalidate(analyticsStatsProvider),
        ),
        data: (stats) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Overview',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.4,
                children: [
                  _StatCard(
                    label: 'Total Users',
                    value: '${stats['totalUsers'] ?? 0}',
                    icon: Icons.people,
                    color: Colors.blue,
                  ),
                  _StatCard(
                    label: 'Total Courses',
                    value: '${stats['totalCourses'] ?? 0}',
                    icon: Icons.book,
                    color: Colors.purple,
                  ),
                  _StatCard(
                    label: 'Enrollments',
                    value: '${stats['totalEnrollments'] ?? 0}',
                    icon: Icons.school,
                    color: Colors.green,
                  ),
                  _StatCard(
                    label: 'Completions',
                    value: stats['completionRate'] != null
                        ? '${stats['completionRate']}%'
                        : '0%',
                    icon: Icons.check_circle,
                    color: Colors.orange,
                  ),
                ],
              ),
              if (_hasEngagementStats(stats)) ...[
                const SizedBox(height: 24),
                const Text(
                  'Engagement',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    if (stats['activeUsers'] != null)
                      _StatCard(
                        label: 'Active Users',
                        value: '${stats['activeUsers']}',
                        icon: Icons.person_pin,
                        color: Colors.teal,
                      ),
                    if (stats['avgSessionDuration'] != null)
                      _StatCard(
                        label: 'Avg Session',
                        value: '${stats['avgSessionDuration']}m',
                        icon: Icons.timer,
                        color: Colors.indigo,
                      ),
                    if (stats['totalRevenue'] != null)
                      _StatCard(
                        label: 'Revenue',
                        value: '\$${stats['totalRevenue']}',
                        icon: Icons.attach_money,
                        color: Colors.green.shade700,
                      ),
                    if (stats['newUsersThisMonth'] != null)
                      _StatCard(
                        label: 'New This Month',
                        value: '${stats['newUsersThisMonth']}',
                        icon: Icons.trending_up,
                        color: Colors.red,
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  bool _hasEngagementStats(Map<String, dynamic> stats) {
    return stats['activeUsers'] != null ||
        stats['avgSessionDuration'] != null ||
        stats['totalRevenue'] != null ||
        stats['newUsersThisMonth'] != null;
  }
}

// ---------------------------------------------------------------------------
// Stat card widget
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
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const Spacer(),
            Text(
              value,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            Text(
              label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared widget
// ---------------------------------------------------------------------------

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
            const Text(
              'Something went wrong',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
