import '../../../core/api/api_client.dart';
import '../../../core/result/result.dart';
import '../domain/entities/course_entity.dart';
import '../domain/repositories/courses_repository_interface.dart';
import 'courses_remote_datasource.dart';

/// Concrete implementation of [ICoursesRepository].
class CoursesRepositoryImpl implements ICoursesRepository {
  final CoursesRemoteDataSource _remote;

  const CoursesRepositoryImpl({required CoursesRemoteDataSource remote})
      : _remote = remote;

  @override
  Future<Result<({List<CourseEntity> courses, int totalCount})>> getCourses({
    required int page,
    required int limit,
    String? search,
  }) async {
    try {
      final json = await _remote.getCourses(
        page: page,
        limit: limit,
        search: search,
      );

      final rawItems = json['items'] as List<dynamic>? ?? [];
      final totalCount = json['total'] as int? ?? rawItems.length;

      final courses = rawItems
          .map((item) =>
              CourseEntity.fromJson(item as Map<String, dynamic>))
          .toList();

      return Success((courses: courses, totalCount: totalCount));
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<CourseEntity>> getCourseById(String id) async {
    try {
      final json = await _remote.getCourse(id);
      return Success(CourseEntity.fromJson(json));
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<void>> enrollCourse(String courseId) async {
    try {
      await _remote.enroll(courseId);
      return const Success(null);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }

  @override
  Future<Result<void>> updateProgress({
    required String courseId,
    required String lessonId,
    required double progressPercent,
  }) async {
    try {
      await _remote.updateProgress(
        courseId: courseId,
        lessonId: lessonId,
        progressPct: progressPercent,
      );
      return const Success(null);
    } on AppException catch (e) {
      return Failure(message: e.message, statusCode: e.statusCode);
    } catch (e) {
      return Failure(message: e.toString());
    }
  }
}
