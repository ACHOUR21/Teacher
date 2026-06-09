import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class NotificationsRemoteDataSource {
  final ApiClient _apiClient;

  NotificationsRemoteDataSource(this._apiClient);

  /// GET /notifications — paginated notification feed for the current user.
  Future<Map<String, dynamic>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.notifications,
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// PATCH /notifications/:id/read — mark a single notification as read.
  Future<Map<String, dynamic>> markAsRead(String id) async {
    try {
      final response = await _apiClient.dio.patch(
        Endpoints.markNotificationRead(id),
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /notifications/mark-all-read — mark every notification as read.
  Future<void> markAllRead() async {
    try {
      await _apiClient.dio.post(Endpoints.markAllNotificationsRead);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /notifications/unread-count — returns `{"count": <int>}`.
  Future<int> getUnreadCount() async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.notificationsUnreadCount);
      final data = response.data;
      if (data is Map) return (data['count'] as num?)?.toInt() ?? 0;
      return 0;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  AppException _mapError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    return AppException(
      message: e.message ?? 'An unexpected error occurred',
      statusCode: e.response?.statusCode,
      originalError: e,
    );
  }
}
