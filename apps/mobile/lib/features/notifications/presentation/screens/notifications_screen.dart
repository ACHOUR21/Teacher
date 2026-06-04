import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

final _dioProvider = Provider((ref) => Dio());

final _notificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(_dioProvider);
  final res = await dio.get('/notifications');
  return (res.data['data']['data'] as List?) ?? [];
});

final _unreadCountProvider = StateProvider<int>((ref) => 0);

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(_notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              final dio = ref.read(_dioProvider);
              await dio.patch('/notifications/read-all');
              ref.invalidate(_notificationsProvider);
            },
            child: const Text('Mark all read', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => _LoadingSkeleton(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (notifications) => notifications.isEmpty
            ? _EmptyState()
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_notificationsProvider),
                child: ListView.separated(
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
                  itemBuilder: (_, i) => _NotificationTile(
                    notification: notifications[i],
                    onTap: () async {
                      final id = notifications[i]['id'] as String?;
                      if (id != null && notifications[i]['readAt'] == null) {
                        final dio = ref.read(_dioProvider);
                        await dio.patch('/notifications/$id/read');
                        ref.invalidate(_notificationsProvider);
                      }
                    },
                  ),
                ),
              ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onTap;
  const _NotificationTile({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isRead = notification['readAt'] != null;
    final type = notification['type'] as String? ?? 'GENERAL';
    final title = notification['title'] as String? ?? 'Notification';
    final body = notification['body'] as String? ?? '';
    final createdAt = notification['createdAt'] as String?;

    return InkWell(
      onTap: onTap,
      child: Container(
        color: isRead ? Colors.transparent : Colors.blue.shade50.withOpacity(0.4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _NotificationIcon(type: type),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                            color: Colors.grey.shade900,
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  if (body.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      body,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (createdAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _timeAgo(createdAt),
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.month}/${dt.day}/${dt.year}';
  }
}

class _NotificationIcon extends StatelessWidget {
  final String type;
  const _NotificationIcon({required this.type});

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (type) {
      'COURSE_ENROLLED' => (Icons.school_outlined, Colors.blue),
      'ASSIGNMENT_DUE' => (Icons.assignment_outlined, Colors.orange),
      'GRADE_PUBLISHED' => (Icons.grade_outlined, Colors.amber),
      'LIVE_SESSION_STARTING' => (Icons.video_call_outlined, Colors.red),
      'MESSAGE_RECEIVED' => (Icons.chat_bubble_outline, Colors.purple),
      'ACHIEVEMENT_EARNED' => (Icons.emoji_events_outlined, Colors.green),
      'CERTIFICATE_ISSUED' => (Icons.workspace_premium_outlined, Colors.teal),
      'PAYMENT_SUCCESS' => (Icons.check_circle_outline, Colors.green),
      'PAYMENT_FAILED' => (Icons.error_outline, Colors.red),
      _ => (Icons.notifications_outlined, Colors.grey),
    };

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, size: 18, color: color),
    );
  }
}

class _LoadingSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) => ListView.separated(
    itemCount: 8,
    separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
    itemBuilder: (_, __) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(width: 36, height: 36, decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(10))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 12, width: double.infinity, decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 6),
                Container(height: 10, width: 200, decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6))),
              ],
            ),
          ),
        ],
      ),
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
            color: Colors.grey.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.notifications_none_outlined, size: 48, color: Colors.grey.shade300),
        ),
        const SizedBox(height: 16),
        const Text('No Notifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(
          "You're all caught up!\nNew notifications will appear here.",
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5),
        ),
      ],
    ),
  );
}
