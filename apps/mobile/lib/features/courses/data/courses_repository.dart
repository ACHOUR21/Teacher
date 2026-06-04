import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../domain/models/course.dart';

class CoursesRepository {
  final ApiClient _apiClient;

  CoursesRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<Course>> getCourses(CoursesFilter filter) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.courses,
        queryParameters: filter.toQueryParams(),
      );

      final data = response.data as Map<String, dynamic>;
      final items = data['items'] as List<dynamic>;
      return items
          .map((item) => Course.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Course> getCourseById(String id) async {
    try {
      final response = await _apiClient.dio.get(Endpoints.courseById(id));
      return Course.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> enrollInCourse(String courseId) async {
    try {
      await _apiClient.dio.post(Endpoints.courseEnroll(courseId));
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Course>> getEnrolledCourses() async {
    try {
      final response = await _apiClient.dio.get(Endpoints.enrolledCourses);
      final items = response.data as List<dynamic>;
      return items
          .map((item) => Course.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Lesson> getLessonById(String courseId, String lessonId) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.lessonById(courseId, lessonId),
      );
      return Lesson.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> updateLessonProgress(
    String courseId,
    String lessonId, {
    required double progressPercent,
    required bool completed,
  }) async {
    try {
      await _apiClient.dio.post(
        Endpoints.lessonProgress(courseId, lessonId),
        data: {
          'progress_percent': progressPercent,
          'completed': completed,
        },
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<CourseReview>> getCourseReviews(String courseId) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.courseReviews(courseId),
      );
      final items = response.data as List<dynamic>;
      return items
          .map((item) => CourseReview.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<String>> getCategories() async {
    try {
      final response = await _apiClient.dio.get(Endpoints.courseCategories);
      return (response.data as List<dynamic>).cast<String>();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    return AppException(
      message: e.message ?? 'An error occurred',
      statusCode: e.response?.statusCode,
    );
  }
}
