import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class CoursesRemoteDataSource {
  final ApiClient _apiClient;

  CoursesRemoteDataSource(this._apiClient);

  /// GET /courses — paginated, filterable course list.
  Future<Map<String, dynamic>> getCourses({
    int page = 1,
    int limit = 20,
    String? search,
    String? category,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.courses,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (search != null && search.isNotEmpty) 'search': search,
          if (category != null && category.isNotEmpty) 'category': category,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /courses/:id — single course detail.
  Future<Map<String, dynamic>> getCourse(String id) async {
    try {
      final response = await _apiClient.dio.get(Endpoints.courseById(id));
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /courses/:id/enroll — enroll the authenticated user in a course.
  Future<Map<String, dynamic>> enroll(String courseId) async {
    try {
      final response =
          await _apiClient.dio.post(Endpoints.courseEnroll(courseId));
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// PUT /courses/:courseId/progress — update course-level progress for the
  /// current user, keyed by the lesson that was just completed.
  Future<Map<String, dynamic>> updateProgress({
    required String courseId,
    required String lessonId,
    required double progressPct,
  }) async {
    try {
      final response = await _apiClient.dio.put(
        Endpoints.courseProgress(courseId),
        data: {
          'lesson_id': lessonId,
          'progress_percent': progressPct,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /students/me/progress — all enrollments with progress data for the
  /// currently authenticated student.
  Future<List<dynamic>> getMyEnrollments() async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.studentMeProgress);
      final data = response.data;
      if (data is List) return data;
      if (data is Map && data.containsKey('items')) {
        return data['items'] as List<dynamic>;
      }
      return [];
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
