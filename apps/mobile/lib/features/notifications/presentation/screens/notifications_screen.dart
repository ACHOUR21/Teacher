import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/api/endpoints.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _notificationsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  const storage = FlutterSecureStorage();
  final token = await storage.read(key: 'access_token');
  final dio = Dio();
  final response = await dio.get(
    '${Endpoints.baseUrl}${Endpoints.notifications}',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
  );
  final data = response.data;
  if (data is Map<String, dynamic>) {
    final inner = data['data'];
    if (inner is List) return inner;
    if (inner is Map<String, dynamic>) {
      final items = inner['items'] ?? inner['data'] ?? inner['notifications'];
      if (items is List) return items;
    }
  }
  if (data is List) return data;
  return [];
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _markAllRead(BuildContext context, WidgetRef ref) async {
    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: 'access_token');
      final dio = Dio();
      await dio.patch(
        '${Endpoints.baseUrl}${Endpoints.markAllNotificationsRead}',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      ref.invalidate(_notificationsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to mark all as read'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(_notificationsProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          notificationsAsync.maybeWhen(
            data: (list) {
              final hasUnread = list.any(
                (n) => n is Map<String, dynamic> && n['readAt'] == null,
              );
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => _markAllRead(context, ref),
                child: const Text(
                  'Mark all read',
                  style: TextStyle(fontSize: 12),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const _LoadingSkeleton(),
        error: (e, _) => _ErrorRetry(
          message: e.toString(),
          onRetry: () => ref.invalidate(_notificationsProvider),
        ),
        data: (notifications) {
          if (notifications.isEmpty) {
            return const _EmptyState();
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_notificationsProvider),
            child: ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (_, __) =>
                  Divider(height: 1, color: Colors.grey.shade100),
              itemBuilder: (_, i) {
                final n = notifications[i];
                if (n is! Map<String, dynamic>) return const SizedBox.shrink();
                return _NotificationTile(
                  notification: n,
                  onTap: () async {
                    final id = n['id'] as String?;
                    if (id != null && n['readAt'] == null) {
                      try {
                        const storage = FlutterSecureStorage();
                        final token = await storage.read(key: 'access_token');
                        final dio = Dio();
                        await dio.patch(
                          '${Endpoints.baseUrl}${Endpoints.markNotificationRead(id)}',
                          options: Options(
                              headers: {'Authorization': 'Bearer $token'}),
                        );
                        ref.invalidate(_notificationsProvider);
                      } catch (_) {
                        // silently ignore mark-read failures
                      }
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Notification Tile
// ---------------------------------------------------------------------------

class _NotificationTile extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onTap;
  const _NotificationTile({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isRead = notification['readAt'] != null;
    final type = (notification['type'] as String? ?? 'GENERAL').toUpperCase();
    final title = notification['title'] as String? ?? 'Notification';
    final body = notification['body'] as String? ??
        notification['message'] as String? ??
        '';
    final createdAt = notification['createdAt'] as String?;

    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isRead ? Colors.transparent : Colors.blue.shade50.withOpacity(0.45),
          border: Border(
            left: BorderSide(
              color: isRead ? Colors.transparent : Colors.blue.shade400,
              width: 3.5,
            ),
          ),
        ),
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
                            fontWeight:
                                isRead ? FontWeight.normal : FontWeight.w600,
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
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (createdAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _timeAgo(createdAt),
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey.shade400),
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

// ---------------------------------------------------------------------------
// Notification Icon
// ---------------------------------------------------------------------------

class _NotificationIcon extends StatelessWidget {
  final String type;
  const _NotificationIcon({required this.type});

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _iconForType(type);
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, size: 18, color: color),
    );
  }

  (IconData, Color) _iconForType(String type) {
    if (type.contains('COURSE') || type.contains('LESSON') || type.contains('ENROLL')) {
      return (Icons.book_outlined, Colors.blue);
    }
    if (type.contains('ASSIGNMENT') || type.contains('HOMEWORK') || type.contains('GRADE')) {
      return (Icons.assignment_outlined, Colors.orange);
    }
    if (type.contains('ACHIEVEMENT') || type.contains('BADGE') || type.contains('STAR')) {
      return (Icons.star_outline_rounded, Colors.amber);
    }
    if (type.contains('PAYMENT') || type.contains('BILLING') || type.contains('INVOICE') || type.contains('PURCHASE')) {
      return (Icons.payment_outlined, Colors.green);
    }
    if (type.contains('MESSAGE') || type.contains('CHAT') || type.contains('COMMENT')) {
      return (Icons.message_outlined, Colors.purple);
    }
    if (type.contains('LIVE') || type.contains('SESSION') || type.contains('WEBINAR')) {
      return (Icons.video_call_outlined, Colors.red);
    }
    if (type.contains('CERTIFICATE')) {
      return (Icons.workspace_premium_outlined, Colors.teal);
    }
    return (Icons.notifications_outlined, Colors.grey);
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: 8,
      separatorBuilder: (_, __) =>
          Divider(height: 1, color: Colors.grey.shade100),
      itemBuilder: (_, __) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 12,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 10,
                    width: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(6),
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
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_none_outlined,
              size: 48,
              color: Colors.grey.shade300,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            "You're all caught up",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'New notifications will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.grey.shade500, fontSize: 13, height: 1.5),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error + Retry
// ---------------------------------------------------------------------------

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded,
                size: 56, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text(
              'Failed to load notifications',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style:
                  TextStyle(fontSize: 12, color: Colors.grey.shade500),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
