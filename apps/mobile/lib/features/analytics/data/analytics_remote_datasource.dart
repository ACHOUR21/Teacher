import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class AnalyticsRemoteDataSource {
  final ApiClient _apiClient;

  AnalyticsRemoteDataSource(this._apiClient);

  /// GET /students/me/performance — aggregated performance metrics (scores,
  /// grade distribution, time-on-task) for the current student.
  Future<Map<String, dynamic>> getStudentPerformance() async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.studentMePerformance);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /students/me/progress — per-course progress breakdown for the
  /// current student (mirrors the enrollments endpoint but analytics-focused).
  Future<Map<String, dynamic>> getLearningProgress() async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.studentMeProgress);
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return {'items': data as List<dynamic>};
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /gamification/me — badges, points, streak, and achievement list for
  /// the current user.
  Future<Map<String, dynamic>> getAchievements() async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.gamificationMe);
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
