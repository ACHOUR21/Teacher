import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class AssignmentsRemoteDataSource {
  final ApiClient _apiClient;

  AssignmentsRemoteDataSource(this._apiClient);

  /// GET /assignments — list assignments, optionally scoped to [courseId].
  Future<Map<String, dynamic>> getAssignments({String? courseId}) async {
    try {
      final response = await _apiClient.dio.get(
        Endpoints.assignments,
        queryParameters: {
          if (courseId != null && courseId.isNotEmpty) 'course_id': courseId,
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      // Normalise a bare list into a standard envelope so callers get a
      // consistent shape regardless of backend response format.
      return {'items': data as List<dynamic>, 'total': (data as List).length};
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /assignments/:id — single assignment detail.
  Future<Map<String, dynamic>> getAssignment(String id) async {
    try {
      final response =
          await _apiClient.dio.get(Endpoints.assignmentById(id));
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// POST /assignments/:id/submit — submit an answer for an assignment.
  ///
  /// [attachments] is a list of previously-uploaded file URLs / IDs.
  Future<Map<String, dynamic>> submitAssignment({
    required String id,
    required String content,
    List<String> attachments = const [],
  }) async {
    try {
      final response = await _apiClient.dio.post(
        Endpoints.assignmentSubmit(id),
        data: {
          'content': content,
          'attachments': attachments,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// GET /assignments/:id/my-submission — fetch the authenticated user's own
  /// submission for a given assignment.
  Future<Map<String, dynamic>> getMySubmission(String assignmentId) async {
    try {
      final response = await _apiClient.dio
          .get(Endpoints.assignmentMySubmission(assignmentId));
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
