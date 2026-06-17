import 'package:dio/dio.dart';
import 'notifications_models.dart';

/// Thin data-layer repository for the notifications feature.
///
/// Uses the raw [Dio] instance (injected from [apiClientProvider]) so we
/// don't duplicate the base-URL or auth interceptor logic.
class NotificationsRepository {
  final Dio _dio;

  NotificationsRepository(this._dio);

  Future<List<AppNotification>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get(
      '/notifications',
      queryParameters: {'page': page, 'limit': limit},
    );
    final List<dynamic> raw = _extractList(response.data);
    return raw
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList();
  }

  Future<void> markAllRead() async {
    await _dio.patch('/notifications/mark-all-read');
  }

  Future<void> markRead(String id) async {
    await _dio.patch('/notifications/$id/read');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  static List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      final inner = data['data'];
      if (inner is List) return inner;
      if (inner is Map<String, dynamic>) {
        final items =
            inner['items'] ?? inner['data'] ?? inner['notifications'];
        if (items is List) return items;
      }
    }
    return [];
  }
}
