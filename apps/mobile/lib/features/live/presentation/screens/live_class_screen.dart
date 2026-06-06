import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';

final _dioProvider = Provider((ref) => Dio());

final _liveClassesProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(_dioProvider);
  final res = await dio.get('/live/sessions');
  final data = res.data['data'];
  return (data is Map ? data['items'] ?? data['data'] ?? [] : data) as List;
});

class LiveClassScreen extends ConsumerWidget {
  const LiveClassScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(_liveClassesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Classes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () => ref.invalidate(_liveClassesProvider),
          ),
        ],
      ),
      body: sessionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorView(error: e, onRetry: () => ref.invalidate(_liveClassesProvider)),
        data: (sessions) {
          if (sessions.isEmpty) {
            return _EmptyState();
          }

          final live = sessions.where((s) => s['status'] == 'LIVE').toList();
          final upcoming = sessions.where((s) => s['status'] == 'SCHEDULED').toList();
          final past = sessions.where((s) => s['status'] == 'ENDED').toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_liveClassesProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (live.isNotEmpty) ...[
                  _SectionHeader(title: 'Live Now', count: live.length, color: Colors.red),
                  const SizedBox(height: 8),
                  ...live.map((s) => _SessionCard(session: s, isLive: true)),
                  const SizedBox(height: 16),
                ],
                if (upcoming.isNotEmpty) ...[
                  _SectionHeader(title: 'Upcoming', count: upcoming.length, color: Colors.blue),
                  const SizedBox(height: 8),
                  ...upcoming.map((s) => _SessionCard(session: s, isLive: false)),
                  const SizedBox(height: 16),
                ],
                if (past.isNotEmpty) ...[
                  _SectionHeader(title: 'Past Sessions', count: past.length, color: Colors.grey),
                  const SizedBox(height: 8),
                  ...past.map((s) => _SessionCard(session: s, isLive: false, isPast: true)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  final Color color;
  const _SectionHeader({required this.title, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 3, height: 18, color: color, margin: const EdgeInsets.only(right: 8)),
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        const SizedBox(width: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
          child: Text('$count', style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Map<String, dynamic> session;
  final bool isLive;
  final bool isPast;
  const _SessionCard({required this.session, required this.isLive, this.isPast = false});

  @override
  Widget build(BuildContext context) {
    final scheduledAt = session['scheduledAt'] != null
        ? DateTime.tryParse(session['scheduledAt'].toString())
        : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: isPast ? null : () => context.go('/home/live/${session['id']}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: LinearGradient(
                    colors: isLive
                        ? [Colors.red.shade600, Colors.orange.shade500]
                        : [Colors.blue.shade600, Colors.purple.shade500],
                  ),
                ),
                child: Icon(isLive ? Icons.videocam : Icons.schedule, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(session['title'] ?? 'Session', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    if (session['description'] != null)
                      Text(session['description'], maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (isLive)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(4)),
                            child: const Row(children: [
                              Icon(Icons.circle, size: 6, color: Colors.white),
                              SizedBox(width: 3),
                              Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ]),
                          )
                        else if (scheduledAt != null)
                          Text(DateFormat('MMM d, h:mm a').format(scheduledAt), style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                        if (session['participantCount'] != null) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.people_outline, size: 12, color: Colors.grey.shade500),
                          const SizedBox(width: 2),
                          Text('${session['participantCount']}', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              if (!isPast)
                Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.video_camera_back_outlined, size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No live classes scheduled', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('Check back later for upcoming sessions', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text('Failed to load sessions', style: Theme.of(context).textTheme.titleMedium),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
