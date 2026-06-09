import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class LiveRemoteDataSource {
  final ApiClient _apiClient;

  LiveRemoteDataSource(this._apiClient);

  /// GET /live/sessions — list upcoming and active live sessions accessible
  /// to the current user.
  Future<Map<String, dynamic>> getSessions({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.liveSessions,
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return {'items': data as List<dynamic>};
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /live/sessions/:id — detail for a single live session.
  Future<Map<String, dynamic>> getSession(String id) async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.liveSessionById(id));
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /live/sessions/:id/join — obtain a join token / room URL for the
  /// current user to enter a live session.
  Future<Map<String, dynamic>> joinSession(String id) async {
    try {
      final response =
          await _apiClient.dio.post(Endpoints.liveSessionJoin(id));
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /live/sessions — create a new live session.
  ///
  /// [scheduledAt] must be a UTC ISO-8601 string.
  Future<Map<String, dynamic>> createSession({
    required String title,
    required String scheduledAt,
    required String courseId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.liveSessions,
        data: {
          'title': title,
          'scheduled_at': scheduledAt,
          'course_id': courseId,
        },
      );
      return response.data as Map<String, dynamic>;
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
