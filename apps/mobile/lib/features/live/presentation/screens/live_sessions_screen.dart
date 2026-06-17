import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

final _dioProvider = Provider((ref) => Dio());

final _liveSessionsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(_dioProvider);
  final res = await dio.get('/live/sessions', queryParameters: {'status': 'SCHEDULED,LIVE'});
  return (res.data['data']['data'] as List?) ?? [];
});

class LiveSessionsScreen extends ConsumerWidget {
  const LiveSessionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(_liveSessionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Classes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () => ref.invalidate(_liveSessionsProvider),
          ),
        ],
      ),
      body: sessionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (sessions) => sessions.isEmpty
            ? _EmptyState()
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_liveSessionsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: sessions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => _SessionCard(session: sessions[i]),
                ),
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/live/create'),
        icon: const Icon(Icons.video_call_outlined),
        label: const Text('Host Session'),
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Map<String, dynamic> session;
  const _SessionCard({required this.session});

  @override
  Widget build(BuildContext context) {
    final isLive = session['status'] == 'LIVE';
    final title = session['title'] as String? ?? 'Untitled Session';
    final participantCount = session['participantCount'] as int? ?? 0;
    final scheduledAt = session['scheduledAt'] as String?;
    final teacher = session['teacher'] as Map<String, dynamic>?;
    final teacherUser = teacher?['user'] as Map<String, dynamic>?;
    final teacherName = teacherUser != null
        ? '${teacherUser['firstName'] ?? ''} ${teacherUser['lastName'] ?? ''}'.trim()
        : 'Unknown';

    return GestureDetector(
      onTap: () => context.push('/live/${session['id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isLive ? Colors.red.shade200 : Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isLive
                      ? [Colors.red.shade700, Colors.orange.shade600]
                      : [Colors.blue.shade700, Colors.purple.shade600],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(Icons.video_call_outlined, size: 40, color: Colors.white.withOpacity(0.4)),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: _StatusBadge(isLive: isLive),
                  ),
                  if (isLive)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.people, size: 12, color: Colors.white),
                            const SizedBox(width: 4),
                            Text('$participantCount', style: const TextStyle(color: Colors.white, fontSize: 11)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 10,
                        backgroundColor: Colors.blue.shade100,
                        child: Text(
                          teacherName.isNotEmpty ? teacherName[0].toUpperCase() : 'T',
                          style: TextStyle(fontSize: 9, color: Colors.blue.shade700),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          teacherName,
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (scheduledAt != null && !isLive) ...[
                        Icon(Icons.schedule, size: 12, color: Colors.grey.shade400),
                        const SizedBox(width: 4),
                        Text(
                          _formatDateTime(scheduledAt),
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/live/${session['id']}'),
                      icon: Icon(isLive ? Icons.play_arrow : Icons.event_outlined, size: 16),
                      label: Text(isLive ? 'Join Now' : 'View Session', style: const TextStyle(fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isLive ? Colors.red.shade600 : Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      return 'Today ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    return '${dt.month}/${dt.day} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _StatusBadge extends StatelessWidget {
  final bool isLive;
  const _StatusBadge({required this.isLive});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: isLive ? Colors.red.shade600 : Colors.blue.shade600,
      borderRadius: BorderRadius.circular(20),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isLive) ...[
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
          ),
          const SizedBox(width: 4),
        ],
        Text(isLive ? 'LIVE' : 'UPCOMING', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
      ],
    ),
  );
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.video_call_outlined, size: 48, color: Colors.blue.shade400),
        ),
        const SizedBox(height: 16),
        const Text('No Live Sessions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(
          'There are no upcoming or live sessions right now.\nCheck back later or host your own!',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5),
        ),
      ],
    ),
  );
}
